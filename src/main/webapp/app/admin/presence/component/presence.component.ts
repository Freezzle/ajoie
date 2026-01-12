import {Component, inject, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';

import {ButtonModule} from 'primeng/button';
import {Popover, PopoverModule} from 'primeng/popover';
import {TableModule} from 'primeng/table';
import {TagModule} from 'primeng/tag';
import {PresenceService} from '../service/presence.service';
import {AccountService} from '../../../core/auth/account.service';
import {TimeSincePipe} from '../../../shared/pipe/time-since.pipe';

@Component({
               selector: 'app-presence',
               imports: [CommonModule, ButtonModule, PopoverModule, TableModule, TagModule, TimeSincePipe],
               templateUrl: './presence.component.html',
               styleUrl: './presence.component.scss'
           })
export class PresenceComponent {
    account = inject(AccountService).trackCurrentAccount();
    @ViewChild('pop') pop!: Popover;
    private presenceService = inject(PresenceService);
    presence$ = this.presenceService.presence$;
    onlineCount$ = this.presenceService.onlineCount$;

    toggle(event: Event) {
        this.pop.toggle(event);
    }
}
