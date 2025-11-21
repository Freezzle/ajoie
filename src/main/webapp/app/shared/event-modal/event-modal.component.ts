import {Component, inject, Input, LOCALE_ID, OnInit} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import {EventLog} from './event.interface';
import EventTypePipe from '../pipe/event-type.pipe';
import {ButtonBoxComponent} from '../components/button-box/button-box.component';
import HasAnyAuthorityDirective from '../auth/has-any-authority.directive';
import {EventService} from './event.service';
import {formatDate} from "@angular/common";

type EventVm = EventLog & { showDate: boolean };

@Component({
    templateUrl: './event-modal.component.html',
    styleUrl: './event-modal.component.scss',
    imports: [SharedModule, ReactiveFormsModule, EventTypePipe, ButtonBoxComponent, HasAnyAuthorityDirective]
})
export class EventModalComponent implements OnInit {

    @Input() events: EventVm[] = [];

    private eventService = inject(EventService);
    private locale = inject(LOCALE_ID);

    constructor(public activeModal: NgbActiveModal) {
    }

    ngOnInit() {
        this.events = this.events.map((e, i, arr) => {
            const currDay = formatDate(e.referenceDate, 'yyyy-MM-dd', this.locale);
            const prevDay =
                i > 0 ? formatDate(arr[i - 1].referenceDate, 'yyyy-MM-dd', this.locale) : null;

            return {
                ...e,
                showDate: currDay !== prevDay,
            };
        });
    }

    onDelete(id: string) {
        this.eventService.deleteEvent(id).subscribe(() => {
            const indexOf = this.events.findIndex(event => event.id === id);
            if (indexOf !== -1) {
                this.events.splice(indexOf, 1);
            }
        });
    }

    close() {
        this.activeModal.dismiss();
    }
}
