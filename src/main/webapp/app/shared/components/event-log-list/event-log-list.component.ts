import {ChangeDetectionStrategy, Component, computed, inject, input, LOCALE_ID, signal} from '@angular/core';
import {formatDate} from '@angular/common';

import SharedModule from 'app/shared/shared.module';
import {EventLog} from '../../event-modal/event.interface';
import {EventService} from '../../event-modal/event.service';
import EventTypePipe from '../../pipe/event-type.pipe';
import {ButtonBoxComponent} from '../button-box/button-box.component';
import HasAnyAuthorityDirective from '../../auth/has-any-authority.directive';

type EventVm = EventLog & {showDate: boolean};

@Component({
               selector: 'app-event-log-list',
               standalone: true,
               imports: [SharedModule, EventTypePipe, ButtonBoxComponent, HasAnyAuthorityDirective],
               templateUrl: './event-log-list.component.html',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class EventLogListComponent {
    readonly events = input<EventLog[]>([]);

    private readonly eventService = inject(EventService);
    private readonly locale = inject(LOCALE_ID);

    private readonly deletedIds = signal<Set<string>>(new Set());

    readonly items = computed<EventVm[]>(() => {
        const deleted = this.deletedIds();
        const kept = this.events().filter(event => !deleted.has(event.id));

        return kept.map((event, index, arr) => {
            const currDay = formatDate(event.referenceDate, 'yyyy-MM-dd', this.locale);
            const prevDay = index > 0 ? formatDate(arr[index - 1].referenceDate, 'yyyy-MM-dd', this.locale) : null;

            return {...event, showDate: currDay !== prevDay};
        });
    });

    onDelete(id: string): void {
        this.eventService.deleteEvent(id).subscribe(() => {
            this.deletedIds.update(ids => {
                const next = new Set(ids);
                next.add(id);

                return next;
            });
        });
    }
}
