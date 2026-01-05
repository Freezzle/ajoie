import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, map, timer} from 'rxjs';
import {Client} from '@stomp/stompjs';
import {ApplicationConfigService} from "../../../core/config/application-config.service";
import SockJS from "sockjs-client";

export interface PresenceSummary {
    login: string;
    displayName: string;
    online: boolean;
    lastSeen: string | null;    // ISO
    lastLoginAt: string | null; // ISO
}

@Injectable({providedIn: 'root'})
export class PresenceService {
    private applicationConfigService = inject(ApplicationConfigService);
    private presenceSubject = new BehaviorSubject<PresenceSummary[]>([]);
    presence$ = this.presenceSubject.asObservable();
    onlineCount$ = this.presence$.pipe(map(list => list.filter(x => x.online).length));

    private client?: Client;
    private pingTimer?: any;

    constructor(private http: HttpClient) {
    }

    loadOnce() {
        this.http.get<PresenceSummary[]>(this.applicationConfigService.getEndpointFor('api/presence/summary')).subscribe({
            next: data => this.presenceSubject.next(data),
        });
    }

    connect() {
        if (this.client?.active) return;

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
            onStompError: () => this.startRestFallback(),
        });

        this.client.activate();
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
        if (this.pingTimer) clearInterval(this.pingTimer);
        this.pingTimer = undefined;
    }

    private startRestFallback() {
        timer(0, 30_000).subscribe(() => this.loadOnce());
    }
}