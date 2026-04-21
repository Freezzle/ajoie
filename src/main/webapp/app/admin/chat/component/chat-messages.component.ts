import {
    AfterViewChecked,
    Component,
    DestroyRef,
    ElementRef,
    inject,
    OnDestroy,
    OnInit,
    signal,
    ViewChild
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {InputTextModule} from 'primeng/inputtext';
import {SelectModule} from 'primeng/select';
import {TagModule} from 'primeng/tag';
import {FormsModule} from '@angular/forms';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ChatConversation, ChatMessage, ChatService} from 'app/admin/chat/service/chat.service';
import {PresenceService} from 'app/admin/presence/service/presence.service';
import {AccountService} from 'app/core/auth/account.service';
import {TimeSincePipe} from 'app/shared/pipe/time-since.pipe';
import {Badge} from 'primeng/badge';
import {ButtonBoxComponent} from 'app/shared/components/button-box/button-box.component';
import {DialogModule} from 'primeng/dialog';
import {TranslateModule} from '@ngx-translate/core';

@Component({
               selector: 'app-chat-messages',
               standalone: true,
               templateUrl: './chat-messages.component.html',
               styleUrl: './chat-messages.component.scss',
               imports: [
                   CommonModule,
                   DialogModule,
                   InputTextModule,
                   SelectModule,
                   TagModule,
                   FormsModule,
                   TimeSincePipe,
                   Badge,
                   ButtonBoxComponent,
                   TranslateModule
               ]
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

    ngOnInit(): void {
        // Récupérer l'utilisateur courant
        this.accountService.identity().subscribe(account => {
            if (account) {
                this.currentUserLogin.set(account.login || null);
            }
        });

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
            .subscribe(msgs => this.messages.set(msgs));

        // Écouter les événements de scroll
        this.chatService.shouldScroll$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.scrollToBottom());

        // Écouter les utilisateurs disponibles
        this.chatService.availableUsers$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(users => this.availableUsers.set(users));

        // Écouter la présence
        this.presenceService.presence$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(presences => {
                const map: { [key: string]: boolean } = {};
                presences.forEach(p => { map[p.login] = p.online; });
                this.presenceMap.set(map);
            });
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
            setTimeout(() => this.initWebSocketForConversation(otherUserId), 500);
            return;
        }

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
