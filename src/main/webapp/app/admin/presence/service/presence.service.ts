import {effect, inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, map, Observable, of, timer} from 'rxjs';
import {Client} from '@stomp/stompjs';
import {ApplicationConfigService} from '../../../core/config/application-config.service';
import {AccountService} from '../../../core/auth/account.service';
import SockJS from 'sockjs-client';

export interface PresenceSummary {
    login: string;
    displayName: string;
    online: boolean;
    lastSeen: string | null;    // ISO
    lastLoginAt: string | null; // ISO
}

@Injectable({providedIn: 'root'})
export class PresenceService {
    onlineCount$ : Observable<number> = of(0);
    private applicationConfigService = inject(ApplicationConfigService);
    private accountService = inject(AccountService);
    private presenceSubject = new BehaviorSubject<PresenceSummary[]>([]);
    presence$ = this.presenceSubject.asObservable();
    private client?: Client;
    private pingTimer?: any;
    private currentUsername: string | null = null;

    // Exposer le client pour les autres services (ChatService)
    getClient(): Client | undefined {
        return this.client;
    }

    constructor(private http: HttpClient) {
        effect(() => {
            this.onlineCount$ = this.presence$.pipe(map(list => list.filter(x => x.online).length));
            // Récupérer le login de l'utilisateur courant au démarrage
            const account = this.accountService.trackCurrentAccount();
            if (account()) {
                this.currentUsername = account()?.login || null;
                this.loadOnce();
            }
        });
    }

    /**
     * Récupère le login de l'utilisateur courant
     */
    getCurrentUsername(): string | null {
        // Essayer de récupérer depuis le service account si pas encore stocké
        if (!this.currentUsername) {
            const account = this.accountService.trackCurrentAccount();
            if (account()) {
                this.currentUsername = account()?.login || null;
            }
        }
        return this.currentUsername;
    }

    loadOnce() {
        this.http.get<PresenceSummary[]>(this.applicationConfigService.getEndpointFor('api/presence/summary')).subscribe({
                                                                                                                             next: data => this.presenceSubject.next(data)
                                                                                                                         });
    }

    connect() {
        if (this.client?.active) {
            return;
        }

        this.client = new Client({
                                     webSocketFactory: () => new SockJS(this.applicationConfigService.getEndpointFor('/ws')),
                                     reconnectDelay: 5000,
                                     onConnect: () => {
                                         this.client?.subscribe('/topic/presence', msg => {
                                             this.presenceSubject.next(JSON.parse(msg.body) as PresenceSummary[]);
                                         });

                                         // initial
                                         this.loadOnce();
                                         this.startPing();
                                     },
                                     onStompError: () => this.startRestFallback()
                                 });

        this.client.activate();
    }

    /**
     * Récupère le displayName d'un utilisateur depuis la liste de présence
     */
    getDisplayName(login: string): string {
        const users = this.presenceSubject.value;
        const user = users.find(u => u.login === login);
        return user?.displayName || login;
    }

    disconnect() {
        this.stopPing();
        this.client?.deactivate();
        this.client = undefined;
    }

    private startPing() {
        this.stopPing();
        this.pingTimer = setInterval(() => {
            if (this.client?.connected) {
                this.client.publish({destination: '/app/presence/ping', body: ''});
            }
        }, 60_000);
    }

    private stopPing() {
        if (this.pingTimer) {
            clearInterval(this.pingTimer);
        }
        this.pingTimer = undefined;
    }

    private startRestFallback() {
        timer(0, 30_000).subscribe(() => this.loadOnce());
    }
}