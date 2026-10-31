import {ChangeDetectionStrategy, Component, computed, inject, input, output} from '@angular/core';
import {CdkDrag, CdkDragDrop, CdkDropList} from '@angular/cdk/drag-drop';
import {TranslateService} from '@ngx-translate/core';

import SharedModule from '../../../shared/shared.module';
import {IFlatSubtask, ISubtaskInstance} from '../model/task-instance.interface';
import {CalendarItemComponent} from './calendar-item.component';
import {
    activeCount,
    CalendarRange,
    dayNumber,
    isSalonDay,
    isWeekend,
    longDayLabel,
    MAX_PER_DAY,
    monthLabel,
    showsMonth
} from './task-calendar.utils';

/**
 * Une case de jour de la grille : en-tête (numéro, mois, pastilles, compteur),
 * sous-tâches du jour, bouton « +N autres » / « Réduire », et cible du
 * glisser-déposer. Les sous-tâches reçues sont filtrées et triées par le parent.
 */
@Component({
               selector: 'app-calendar-day',
               imports: [SharedModule, CdkDrag, CdkDropList, CalendarItemComponent],
               templateUrl: './calendar-day.component.html',
               styleUrl: './calendar-day.component.scss',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class CalendarDayComponent {
    readonly day = input.required<string>();
    readonly items = input<IFlatSubtask[]>([]);
    readonly range = input.required<CalendarRange>();
    readonly todayDate = input.required<string>();
    readonly salonStart = input<string | null>(null);
    readonly salonEnd = input<string | null>(null);
    readonly known = input<string[]>([]);
    readonly expanded = input<boolean>(false);
    readonly narrow = input<boolean>(false);
    readonly flashedId = input<string | null>(null);

    readonly toggleExpand = output<string>();
    readonly changed = output<ISubtaskInstance>();
    readonly editRequested = output<ISubtaskInstance>();
    readonly dropped = output<CdkDragDrop<string>>();

    private readonly translateService = inject(TranslateService);

    readonly max = MAX_PER_DAY;

    readonly number = computed(() => dayNumber(this.day()));
    readonly month = computed(() => monthLabel(this.day()));
    readonly withMonth = computed(() => showsMonth(this.day(), this.range()));
    readonly weekend = computed(() => isWeekend(this.day()));
    readonly past = computed(() => this.day() < this.todayDate());
    readonly isToday = computed(() => this.day() === this.todayDate());
    readonly salon = computed(() => isSalonDay(this.day(), this.salonStart(), this.salonEnd()));
    readonly isSalonStart = computed(() => this.salon() && this.day() === this.salonStart());
    readonly activeTotal = computed(() => activeCount(this.items()));
    readonly overloaded = computed(() => this.activeTotal() > MAX_PER_DAY);

    readonly shownItems = computed(() =>
        this.expanded() ? this.items() : this.items().slice(0, MAX_PER_DAY));

    readonly hiddenCount = computed(() => this.items().length - this.shownItems().length);

    readonly canReduce = computed(() => this.expanded() && this.items().length > MAX_PER_DAY);

    readonly ariaLabel = computed(() =>
        this.translateService.instant('task.calendar.dayAria', {
            day: longDayLabel(this.day()),
            count: this.items().length
        }) as string);

    /** Un jour passé n'accepte aucun dépôt. */
    readonly enterPredicate = (): boolean => !this.past();

    onDrop(event: CdkDragDrop<string>): void {
        this.dropped.emit(event);
    }
}
