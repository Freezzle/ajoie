import {Component, Input} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import {EventLog} from './event.interface';
import {ButtonBoxComponent} from '../components/button-box/button-box.component';
import {EventLogListComponent} from '../components/event-log-list/event-log-list.component';

@Component({
               templateUrl: './event-modal.component.html',
               styleUrl: './event-modal.component.scss',
               imports: [ButtonBoxComponent, EventLogListComponent]
           })
export class EventModalComponent {

    @Input() events: EventLog[] = [];

    constructor(public activeModal: NgbActiveModal) {
    }

    close() {
        this.activeModal.dismiss();
    }
}
