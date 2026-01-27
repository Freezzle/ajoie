import {
    AfterViewChecked,
    Component,
    DestroyRef, effect,
    ElementRef,
    inject,
    OnDestroy,
    OnInit,
    signal,
    ViewChild
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ButtonModule} from 'primeng/button';
import {DialogModule} from 'primeng/dialog';
import {InputTextModule} from 'primeng/inputtext';
import {ListboxModule} from 'primeng/listbox';
import {SelectModule} from 'primeng/select';
import {TagModule} from 'primeng/tag';
import {FormsModule} from '@angular/forms';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {take} from 'rxjs';
import {ChatConversation, ChatMessage, ChatService} from '../../chat/service/chat.service';
import {PresenceService} from '../../presence/service/presence.service';
import {AccountService} from '../../../core/auth/account.service';
import {TimeSincePipe} from '../../../shared/pipe/time-since.pipe';
import {Badge} from 'primeng/badge';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';

@Component({
               selector: 'app-chat-messages',
               standalone: true,
               imports: [
                   CommonModule,
                   ButtonModule,
                   DialogModule,
                   InputTextModule,
                   ListboxModule,
                   SelectModule,
                   TagModule,
                   FormsModule,
                   TimeSincePipe,
                   Badge,
                   ButtonBoxComponent
               ],
               template: `
                   <!-- Bouton icône Messages dans la navbar -->
                   <button-box (clickedEvent)="toggleDialog()"
                               [showText]="false"
                               [badge]="unreadCount() > 0 ? (unreadCount() + '') : ''"
                               badgeSeverity="danger"
                               primeIcon="pi-envelope"
                               translateKey="navbar.messages"
                               type="secondary">
                   </button-box>

                   <!-- Dialog principal (PrimeNG) -->
                   <p-dialog [visible]="dialogVisible()"
                             (visibleChange)="dialogVisible.set($event)"
                             [header]="'Messages'"
                             [modal]="true"
                             [style]="{ width: '90vw', maxWidth: '800px' }"
                             [maximizable]="true"
                             (onHide)="onDialogHide()">

                       <!-- Vue principale : Création OU Chat OU Conversations -->
                       @if (creatingNewChat()) {
                           <!-- Vue création d'un nouveau chat -->
                           <div class="new-chat-form">
                               <h4 class="mb-3">Sélectionner un utilisateur</h4>

                               @if (availableUsers().length > 0) {
                                   <p-select [(ngModel)]="selectedNewChatUser"
                                             [options]="availableUsers()"
                                             placeholder="Choisir un utilisateur"
                                             [fluid]="true">
                                   </p-select>
                               } @else {
                                   <p class="text-muted">Aucun utilisateur disponible.</p>
                               }

                               <div class="mt-3">
                                   <p-button
                                           (click)="createNewConversation()"
                                           [disabled]="!selectedNewChatUser"
                                           label="Démarrer le chat"
                                           severity="success"
                                           class="me-2">
                                   </p-button>
                                   <p-button
                                           (click)="cancelNewChat()"
                                           label="Annuler"
                                           severity="secondary">
                                   </p-button>
                               </div>
                           </div>
                       } @else if (selectedConversationUser()) {
                           <!-- Vue de la conversation / chat window -->
                           <div class="chat-window d-flex flex-column" [style.height]="'500px'">
                               <!-- Header : nom de l'utilisateur -->
                               <div class="chat-header d-flex justify-content-between align-items-center p-3 border-bottom">
                                   <h4 class="fw-bold">{{ selectedConversationUserDisplayName() }}</h4>
                                   <p-button
                                           (click)="goBack()"
                                           icon="pi pi-arrow-left"
                                           type="button"
                                           [text]="true">
                                   </p-button>
                               </div>

                               <!-- Messages (scrollable) -->
                               <div #chatMessages class="chat-messages flex-grow-1 overflow-y-auto p-3">
                                   @for (msg of messages(); track msg.timestamp + msg.senderId + msg.content) {
                                       <div [class.message-sent]="msg.senderId === currentUserLogin() || msg.senderId === ''"
                                            [class.message-received]="msg.senderId !== currentUserLogin() && msg.senderId !== ''"
                                            class="message mb-3">
                                           <div [class.bubble-sent]="msg.senderId === currentUserLogin() || msg.senderId === ''"
                                                [class.bubble-received]="msg.senderId !== currentUserLogin() && msg.senderId !== ''"
                                                class="bubble px-3 py-2 rounded">
                                               {{ msg.content }}
                                           </div>
                                           <small class="text-muted">{{ msg.timestamp | timeSince }}</small>
                                       </div>
                                   }
                               </div>

                               <!-- Input message -->
                               <div class="chat-input p-3 border-top d-flex gap-2">
                                   <input [(ngModel)]="messageContent"
                                          pInputText
                                          type="text"
                                          placeholder="Écrivez un message..."
                                          (keyup.enter)="sendMessage()"
                                          class="form-control">
                                   <p-button (click)="sendMessage()"
                                             [disabled]="!messageContent.trim()"
                                             icon="pi pi-send"
                                             type="button">
                                   </p-button>
                               </div>
                           </div>
                       } @else {
                           <!-- Affichage de la liste des conversations -->
                           <div class="chat-conversations">
                               <div class="d-flex gap-2 mb-3">
                                   <p-button
                                           (click)="switchToNewChat()"
                                           icon="pi pi-plus"
                                           label="Nouveau chat"
                                           severity="success"
                                           size="small">
                                   </p-button>
                               </div>

                               @if (conversations().length > 0) {
                                   <div class="conversation-list">
                                       @for (conv of conversations(); track conv.id) {
                                           <div (click)="selectConversation(conv)"
                                                [class.selected]="selectedConversationUser() === getOtherUser(conv)"
                                                class="conversation-item p-3 cursor-pointer border rounded">
                                               <!-- Ligne 1 : Nom + Compteur + Statut -->
                                               <div class="d-flex justify-content-between align-items-center mb-2">
                                                   <div class="d-flex align-items-center gap-2">
                                                       <span class="fw-medium">{{ presenceService.getDisplayName(getOtherUser(conv)) }}</span>
                                                       @if (conv.unreadCount && conv.unreadCount > 0) {
                                                           <p-badge [value]="conv.unreadCount + ''"
                                                                    severity="danger"></p-badge>
                                                       }
                                                   </div>
                                                   @if (Object.keys(presenceMap()).length > 0) {
                                                       <p-tag
                                                               [severity]="isUserOnline(getOtherUser(conv)) ? 'success' : 'danger'"
                                                               [value]="isUserOnline(getOtherUser(conv)) ? 'En ligne' : 'Hors ligne'"
                                                               [styleClass]="'text-xs'">
                                                       </p-tag>
                                                   }
                                               </div>
                                               <!-- Ligne 2 : Dernier message -->
                                               @if (conv.lastMessageTime) {
                                                   <small class="text-muted">{{ conv.lastMessageTime | timeSince }}</small>
                                               }
                                           </div>
                                       }
                                   </div>
                               } @else {
                                   <p class="text-muted text-center">Aucune conversation. Cliquez sur "Nouveau
                                       chat".</p>
                               }
                           </div>
                       }
                   </p-dialog>
               `,
               styles: [`
                          :host ::ng-deep {
                            .conversation-item {
                              cursor: pointer;
                              transition: background-color 0.2s;

                              &:hover {
                                background-color: #f8f9fa;
                              }

                              &.selected {
                                background-color: #e7f3ff;
                                border: 1px solid #0d6efd !important;
                              }
                            }

                            .message-sent {
                              display: flex;
                              flex-direction: column;
                              align-items: flex-end;

                              .bubble-sent {
                                background-color: #0d6efd;
                                color: white;
                                max-width: 70%;
                              }
                            }

                            .message-received {
                              display: flex;
                              flex-direction: column;
                              align-items: flex-start;

                              .bubble-received {
                                background-color: #e9ecef;
                                color: black;
                                max-width: 70%;
                              }
                            }

                            .chat-window {
                              display: flex;
                              flex-direction: column;
                            }

                            .chat-messages {
                              flex: 1;
                              overflow-y: auto;
                            }

                            .chat-input input {
                              flex: 1;
                            }
                          }
                        `]
           })
export class ChatMessagesComponent implements OnInit, OnDestroy, AfterViewChecked {
    private chatService = inject(ChatService);
    presenceService = inject(PresenceService);
    private accountService = inject(AccountService);
    private destroyRef = inject(DestroyRef);

    @ViewChild('chatMessages') chatMessagesDiv!: ElementRef;

    // Signals
    dialogVisible = signal(false);
    conversations = signal<ChatConversation[]>([]);
    messages = signal<ChatMessage[]>([]);
    availableUsers = signal<string[]>([]);
    unreadCount = signal(0);
    presenceMap = signal<{ [key: string]: boolean }>({});

    selectedConversationUser = signal<string | null>(null);
    selectedConversationUserDisplayName = signal<string | null>(null);
    creatingNewChat = signal(false);
    selectedNewChatUser: string | null = null;
    messageContent = '';
    currentUserLogin = signal<string | null>(null);
    private shouldScroll = false;

    constructor() {
        effect(() => {
            // Récupérer l'utilisateur courant
            const accountSignal = this.accountService.trackCurrentAccount();
            if (accountSignal()) {
                this.currentUserLogin.set(accountSignal()!.login || null);
            }

            console.log('[APP] ngOnInit du chat component');

            // Charger les conversations
            this.chatService.loadConversations();
            this.chatService.conversationList$
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe(convs => this.conversations.set(convs));

            // Charger le compteur de messages non lus
            this.chatService.loadUnreadCount();
            this.chatService.unreadCount$
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe(count => this.unreadCount.set(count));

            // Écouter les messages entrants
            this.chatService.messages$
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe(msgs => {
                    console.log('Messages mis à jour:', msgs);
                    this.messages.set(msgs);
                });

            // Écouter les événements de scroll
            this.chatService.shouldScroll$
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe(() => {
                    this.scrollToBottom();
                });

            // Écouter les utilisateurs disponibles
            this.chatService.availableUsers$
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe(users => this.availableUsers.set(users));

            // Écouter la présence
            this.presenceService.presence$
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe(presences => {
                    const map: { [key: string]: boolean } = {};
                    presences.forEach(p => {
                        map[p.login] = p.online;
                    });
                    this.presenceMap.set(map);
                });
        });
    }

    ngOnInit(): void {

    }

    ngOnDestroy(): void {
        this.chatService.resetMessages();
    }

    ngAfterViewChecked(): void {
        if (this.shouldScroll && this.chatMessagesDiv) {
            this.scrollToBottom();
            this.shouldScroll = false;
        }
    }

    private scrollToBottom(): void {
        if (this.chatMessagesDiv) {
            try {
                const element = this.chatMessagesDiv.nativeElement;
                element.scrollTop = element.scrollHeight;
            } catch (err) {
                console.warn('[CHAT] Erreur lors du scroll:', err);
            }
        }
    }

    toggleDialog(): void {
        this.dialogVisible.update(v => !v);

        const stompClient = this.presenceService.getClient();

        if (this.dialogVisible()) {
            // Dialog ouvert : initialiser l'écoute globale
            if (stompClient?.connected) {
                this.chatService.initGlobalWebSocketListener(stompClient);
            }
            // Recharger les données
            this.chatService.loadConversations();
            this.chatService.loadUnreadCount();
        } else {
            // Dialog fermé : arrêter l'écoute globale
            this.chatService.stopGlobalWebSocketListener();
        }
    }

    selectConversation(conv: ChatConversation): void {
        const other = this.getOtherUser(conv);
        this.selectedConversationUser.set(other);
        this.selectedConversationUserDisplayName.set(this.presenceService.getDisplayName(other));
        this.chatService.setCurrentConversationUser(other);

        // Arrêter l'écoute globale quand on rentre dans une conversation spécifique
        this.chatService.stopGlobalWebSocketListener();

        this.chatService.loadMessages(other);
        this.chatService.markAsRead(other);
        this.initWebSocketForConversation(other);

        // Attendre que les messages se chargent puis scroller
        setTimeout(() => {
            this.scrollToBottom();
        }, 100);
    }

    private initWebSocketForConversation(otherUserId: string): void {
        const stompClient = this.presenceService.getClient();
        if (!stompClient?.connected) {
            console.log('[APP] ⚠️ Client pas connecté, retry dans 500ms');
            setTimeout(() => this.initWebSocketForConversation(otherUserId), 500);
            return;
        }

        console.log('[APP] ✅ Initialisation WebSocket pour conversation avec:', otherUserId);
        const scrollCallback = () => {
            this.shouldScroll = true;
        };
        this.chatService.initWebSocketListener(stompClient, otherUserId, scrollCallback);
    }

    switchToNewChat(): void {
        this.creatingNewChat.set(true);
        this.selectedNewChatUser = null;
        this.messageContent = '';
        this.chatService.loadAvailableUsers();
    }

    createNewConversation(): void {
        if (!this.selectedNewChatUser) {
            return;
        }

        const recipientId = this.selectedNewChatUser;

        this.chatService.createConversation(recipientId).subscribe({
            next: () => {
                this.creatingNewChat.set(false);
                this.selectedConversationUser.set(recipientId);
                this.selectedConversationUserDisplayName.set(this.presenceService.getDisplayName(recipientId));
                this.chatService.setCurrentConversationUser(recipientId);
                this.selectedNewChatUser = null;
                this.messageContent = '';
                this.shouldScroll = true;

                // Arrêter l'écoute globale quand on rentre dans une conversation spécifique
                this.chatService.stopGlobalWebSocketListener();

                this.chatService.loadMessages(recipientId);
                this.chatService.loadConversations();
                this.chatService.markAsRead(recipientId);
                this.initWebSocketForConversation(recipientId);

                // Attendre que les messages se chargent puis scroller
                setTimeout(() => {
                    this.scrollToBottom();
                }, 100);
            },
            error: (err) => console.error('Erreur création conversation', err)
        });
    }

    cancelNewChat(): void {
        this.creatingNewChat.set(false);
        this.selectedNewChatUser = null;
    }

    goBack(): void {
        this.selectedConversationUser.set(null);
        this.selectedConversationUserDisplayName.set(null);
        this.chatService.setCurrentConversationUser(null);
        this.messageContent = '';
        this.chatService.resetMessages();
    }

    sendMessage(): void {
        if (!this.messageContent.trim() || !this.selectedConversationUser()) {
            return;
        }

        const client = this.presenceService.getClient();
        if (!client || !client.connected) {
            console.error('WebSocket non connecté');
            return;
        }

        this.chatService.sendMessage(client, this.selectedConversationUser()!, this.messageContent);
        this.messageContent = '';
        this.shouldScroll = true;
    }

    getOtherUser(conv: ChatConversation): string {
        return conv.participantA === this.currentUserLogin() ? conv.participantB : conv.participantA;
    }

    isUserOnline(login: string): boolean {
        return this.presenceMap()[login] ?? false;
    }

    onDialogHide(): void {
        this.goBack();
        this.creatingNewChat.set(false);
        this.chatService.stopGlobalWebSocketListener();
    }

    protected readonly Object = Object;
}
