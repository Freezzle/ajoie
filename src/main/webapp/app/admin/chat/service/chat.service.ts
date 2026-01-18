import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { ApplicationConfigService } from '../../../core/config/application-config.service';
import { PresenceService } from '../../presence/service/presence.service';

export interface ChatMessage {
  id?: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: string; // ISO
  isRead: boolean;
}

export interface ChatConversation {
  id?: string;
  participantA: string;
  participantB: string;
  lastMessageTime?: string | null; // ISO
  unreadCount?: number;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);
  private applicationConfigService = inject(ApplicationConfigService);
  private presenceService = inject(PresenceService);

  // Subjects
  private conversationListSubject = new BehaviorSubject<ChatConversation[]>([]);
  conversationList$ = this.conversationListSubject.asObservable();

  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  messages$ = this.messagesSubject.asObservable();

  private incomingMessageSubject = new Subject<ChatMessage>();
  incomingMessage$ = this.incomingMessageSubject.asObservable();

  private availableUsersSubject = new BehaviorSubject<string[]>([]);
  availableUsers$ = this.availableUsersSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();

  private shouldScrollSubject = new Subject<void>();
  shouldScroll$ = this.shouldScrollSubject.asObservable();

  private currentConversationUser: string | null = null;
  private readConversations: Set<string> = new Set();
  private globalWebSocketSubscription: any = null;

  /**
   * Définir l'utilisateur de la conversation courante (pour savoir à quel topic écouter)
   */
  setCurrentConversationUser(login: string | null): void {
    this.currentConversationUser = login;
    // Réinitialiser le tracking si on ferme la conversation
    if (login === null) {
      this.readConversations.clear();
    }
  }

  private webSocketSubscription: any = null;

  /**
   * Initialise une subscription WebSocket globale pour rafraîchir les conversations
   * Appelée quand on affiche la liste des conversations
   */
  initGlobalWebSocketListener(client: any): void {
    console.log('[CHAT] Initialisation de l\'écoute WebSocket globale');

    if (!client || !client.connected) {
      console.warn('[CHAT] Client pas connecté');
      return;
    }

    // Si une subscription globale existe déjà, ne pas en créer une autre
    if (this.globalWebSocketSubscription) {
      console.log('[CHAT] Écoute globale déjà active');
      return;
    }

    // S'abonner à /user/queue/messages pour recevoir tous les messages
    console.log('[CHAT] ✅ Création subscription à /user/queue/messages');
    this.globalWebSocketSubscription = client.subscribe('/user/queue/messages',
      (message: any) => {
        console.log('[CHAT] 📨 Message global reçu sur /user/queue/messages');
        try {
          const msg = JSON.parse(message.body) as ChatMessage;
          console.log('[CHAT] Message global parsé:', msg);

          // Si on n'est pas dans une conversation spécifique (on est sur la liste),
          // rafraîchir les conversations et le compteur
          if (!this.currentConversationUser) {
            console.log('[CHAT] 🔄 On est sur la liste des conversations, rafraîchissant...');
            this.loadConversations();
            this.loadUnreadCount();
          }
        } catch (e) {
          console.error('[CHAT] ❌ Erreur parsing message global:', e);
        }
      },
      (error: any) => {
        console.error('[CHAT] ❌ Erreur WebSocket subscribe global:', error);
      }
    );
  }

  /**
   * Arrête l'écoute WebSocket globale
   */
  stopGlobalWebSocketListener(): void {
    if (this.globalWebSocketSubscription) {
      console.log('[CHAT] Fermeture de l\'écoute WebSocket globale');
      this.globalWebSocketSubscription.unsubscribe();
      this.globalWebSocketSubscription = null;
    }
  }

  /**
   * Initialise l'écoute WebSocket pour les messages entrants d'une conversation spécifique
   */
  initWebSocketListener(client: any, otherUserId: string, onMessageReceived?: () => void): void {
    console.log('[CHAT] initWebSocketListener appelé pour conversation avec:', otherUserId);
    console.log('[CHAT] client:', client);
    console.log('[CHAT] client.connected:', client?.connected);

    if (!client) {
      console.warn('[CHAT] ❌ Client est null');
      return;
    }

    if (!client.connected) {
      console.warn('[CHAT] ❌ Client pas connecté');
      return;
    }

    // Si une subscription existe déjà, la fermer
    if (this.webSocketSubscription) {
      console.log('[CHAT] Fermeture de la subscription précédente');
      this.webSocketSubscription.unsubscribe();
    }

    // Créer la clé de conversation déterministe
    const conversationKey = this.getConversationKey(otherUserId);
    console.log('[CHAT] Clé de conversation:', conversationKey);

    // Écouter les messages entrants sur /user/queue/chat/{conversationKey} (spécifique à la conversation)
    const subscription = `/user/queue/chat/${conversationKey}`;
    console.log('[CHAT] ✅ Création subscription à:', subscription);

    this.webSocketSubscription = client.subscribe(subscription,
      (message: any) => {
        console.log('[CHAT] 📨 Message reçu sur', subscription, ':', message);
        try {
          const msg = JSON.parse(message.body) as ChatMessage;
          console.log('[CHAT] Message parsé:', msg);

          this.incomingMessageSubject.next(msg);

          // Ajouter au flux des messages
          const currentMsgs = this.messagesSubject.value;

          // Vérifier les doublons
          const isDuplicate = currentMsgs.some(m =>
            m.id === msg.id  // Comparer par ID pour éviter les doublons
          );

          if (!isDuplicate) {
            console.log('[CHAT] ✅ Ajout du message au flux');
            this.messagesSubject.next([...currentMsgs, msg]);

            // Marquer comme lu automatiquement SEULEMENT si on est dans cette conversation
            if (this.currentConversationUser === otherUserId) {
              console.log('[CHAT] 📤 On est dans la conversation, marquant le message comme lu automatiquement');
              this.markAsRead(otherUserId);
            } else {
              console.log('[CHAT] 📭 On n\'est pas dans cette conversation, ne marquant pas comme lu');
              // Recharger les conversations et le compteur global (on n'est pas dans la conversation)
              this.loadConversations();
              this.loadUnreadCount();
            }

            // Émettre un événement pour scroller
            this.shouldScrollSubject.next();
          } else {
            console.log('[CHAT] ⚠️ Message est un doublon (ID déjà présent), ignoré');
          }

          // Notifier le composant (pour scroll)
          if (onMessageReceived) {
            onMessageReceived();
          }
        } catch (e) {
          console.error('[CHAT] ❌ Erreur parsing message:', e);
        }
      },
      (error: any) => {
        console.error('[CHAT] ❌ Erreur WebSocket subscribe:', error);
      }
    );

    console.log('[CHAT] ✅ Subscription créée');
  }

  /**
   * Charge les conversations de l'utilisateur courant
   */
  loadConversations(): void {
    this.http.get<ChatConversation[]>(
      this.applicationConfigService.getEndpointFor('api/chat/conversations')
    ).subscribe({
      next: (conversations) => this.conversationListSubject.next(conversations),
      error: (err) => console.error('Erreur chargement conversations', err)
    });
  }

  /**
   * Charge l'historique des messages avec un utilisateur
   */
  loadMessages(otherUserId: string): void {
    this.http.get<ChatMessage[]>(
      this.applicationConfigService.getEndpointFor(`api/chat/conversations/${otherUserId}/messages`)
    ).subscribe({
      next: (messages) => {
        this.messagesSubject.next(messages);
        // Émettre un événement pour scroller au bas
        setTimeout(() => {
          this.shouldScrollSubject.next();
        }, 50);
      },
      error: (err) => console.error('Erreur chargement messages', err)
    });
  }

  /**
   * Charge le compteur de messages non lus
   */
  loadUnreadCount(): void {
    this.http.get<number>(
      this.applicationConfigService.getEndpointFor('api/chat/unread-count')
    ).subscribe({
      next: (count) => this.unreadCountSubject.next(count),
      error: (err) => console.error('Erreur chargement compteur messages non lus', err)
    });
  }

  /**
   * Envoie un message via WebSocket
   */
  sendMessage(client: any, recipientId: string, content: string): void {
    if (!client || !client.connected) {
      console.error('WebSocket non connecté');
      return;
    }

    client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({ recipientId, content })
    });

    // NE PAS ajouter localement - laisser le serveur broadcaster le message via WebSocket
    // Cela évite les doublons et assure que tout le monde reçoit le message correctement
  }

  /**
   * Marque les messages comme lus pour une conversation
   */
  markAsRead(otherUserId: string): void {
    // Éviter les appels dupliqués pour la même conversation
    if (this.readConversations.has(otherUserId)) {
      console.log('[CHAT] Conversation', otherUserId, 'déjà marquée comme lue, skip');
      return;
    }

    this.readConversations.add(otherUserId);

    this.http.post(
      this.applicationConfigService.getEndpointFor(`api/chat/conversations/${otherUserId}/mark-as-read`),
      {}
    ).subscribe({
      next: () => {
        console.log('[CHAT] Messages marqués comme lus pour:', otherUserId);
        // Recharger le compteur global
        this.loadUnreadCount();
        // Recharger les conversations pour mettre à jour le compteur local
        this.loadConversations();
      },
      error: (err) => {
        console.error('Erreur marquage messages comme lus', err);
        // Retirer de l'ensemble en cas d'erreur pour permettre une retry
        this.readConversations.delete(otherUserId);
      }
    });
  }
  createConversation(recipientId: string): Observable<ChatConversation> {
    return new Observable(observer => {
      this.http.post<ChatConversation>(
        this.applicationConfigService.getEndpointFor('api/chat/conversations'),
        { recipientId }
      ).subscribe({
        next: (conversation) => {
          // Recharger la liste des conversations
          this.loadConversations();
          // Charger les messages (vide au départ)
          this.loadMessages(recipientId);
          observer.next(conversation);
          observer.complete();
        },
        error: (err) => {
          console.error('Erreur création conversation', err);
          observer.error(err);
        }
      });
    });
  }

  /**
   * Charge les utilisateurs disponibles pour un nouveau chat
   */
  loadAvailableUsers(): void {
    this.http.get<string[]>(
      this.applicationConfigService.getEndpointFor('api/chat/available-users')
    ).subscribe({
      next: (users) => this.availableUsersSubject.next(users),
      error: (err) => console.error('Erreur chargement utilisateurs', err)
    });
  }

  /**
   * Récupère le STOMP client depuis PresenceService (passé en param)
   */
  getStompClient(): any {
    // Le client STOMP sera passé via les composants
    return null;
  }

  /**
   * Réinitialise les messages de la conversation courante
   */
  resetMessages(): void {
    this.messagesSubject.next([]);
  }

  /**
   * Crée une clé unique et déterministe pour une conversation
   * Même clé que côté backend: admin_dylan ou dylan_admin (toujours dans le même ordre)
   */
  private getConversationKey(otherUserId: string): string {
    // Récupérer l'utilisateur courant depuis la présence ou un autre service
    const currentUser = this.presenceService.getCurrentUsername();

    if (!currentUser) {
      console.warn('[CHAT] ⚠️ Impossible de récupérer l\'utilisateur courant');
      return '';
    }

    // Trier les deux utilisateurs pour une clé déterministe
    const users = [currentUser, otherUserId].sort();
    return users[0] + '_' + users[1];
  }
}
