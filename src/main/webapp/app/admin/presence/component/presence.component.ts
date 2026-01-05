import {Component, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';

import {ButtonModule} from 'primeng/button';
import {Popover, PopoverModule} from 'primeng/popover';
import {TableModule} from 'primeng/table';
import {TagModule} from 'primeng/tag';
import {PresenceService} from "../service/presence.service";
import {AccountService} from "../../../core/auth/account.service";
import {TimeSincePipe} from "../../../shared/pipe/time-since.pipe";

@Component({
    selector: 'app-presence',
    imports: [CommonModule, ButtonModule, PopoverModule, TableModule, TagModule, TimeSincePipe],
    templateUrl: './presence.component.html',
    styleUrl: './presence.component.scss',
})
export class PresenceComponent implements OnInit, OnDestroy {
    private presenceService = inject(PresenceService);
    account = inject(AccountService).trackCurrentAccount();

    presence$ = this.presenceService.presence$;
    onlineCount$ = this.presenceService.onlineCount$;

    @ViewChild('pop') pop!: Popover;

    ngOnInit() {
        this.presenceService.connect();
    }

    ngOnDestroy(): void {
        this.presenceService.disconnect();
    }

    toggle(event: Event) {
        this.pop.toggle(event);
    }
}
