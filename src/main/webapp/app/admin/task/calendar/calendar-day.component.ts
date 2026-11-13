import {ChangeDetectionStrategy, Component, computed, inject, input, output} from '@angular/core';
import {CdkDrag, CdkDragDrop, CdkDropList} from '@angular/cdk/drag-drop';
import {TranslateService} from '@ngx-translate/core';

import SharedModule from '../../../shared/shared.module';
import {IFlatSubtask, ISubtaskInstance} from '../model/task-instance.interface';
import {CalendarItemComponent} from './calendar-item.component';
import {SubtaskEditRequest} from './calendar-quick-add.component';
import {
    activeCount,
    CalendarRange,
    dayNumber,
    isFirstOfMonth,
    isInMonth,
    isSalonDay,
    longDayLabel,
    longMonthLabel,
    MAX_PER_DAY,
    monthLabel
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
    readonly editRequested = output<SubtaskEditRequest>();
    readonly dropped = output<CdkDragDrop<string>>();
    /** Clic sur la zone vide de la case ou sur « + ajouter ». */
    readonly addRequested = output<{day: string; element: HTMLElement}>();

    private readonly translateService = inject(TranslateService);

    readonly max = MAX_PER_DAY;

    readonly number = computed(() => dayNumber(this.day()));
    readonly month = computed(() => monthLabel(this.day()));
    readonly firstOfMonth = computed(() => isFirstOfMonth(this.day()));
    readonly longMonth = computed(() => longMonthLabel(this.day()));
    /** Faux pour les jours affichés mais extérieurs au mois de référence. */
    readonly inMonth = computed(() => isInMonth(this.day(), this.range()));
    readonly past = computed(() => this.day() < this.todayDate());
    readonly isToday = computed(() => this.day() === this.todayDate());
    readonly salon = computed(() => isSalonDay(this.day(), this.salonStart(), this.salonEnd()));
    readonly isSalonStart = computed(() => this.salon() && this.day() === this.salonStart());
    readonly activeTotal = computed(() => activeCount(this.items()));
    readonly overloaded = computed(() => this.activeTotal() > MAX_PER_DAY);

    readonly firstOfMonthLabel = computed(() =>
        this.translateService.instant('task.calendar.firstOfMonth', {month: this.longMonth()}) as string);

    readonly shownItems = computed(() =>
        this.expanded() ? this.items() : this.items().slice(0, MAX_PER_DAY));

    readonly hiddenCount = computed(() => this.items().length - this.shownItems().length);

    readonly canReduce = computed(() => this.expanded() && this.items().length > MAX_PER_DAY);

    readonly ariaLabel = computed(() =>
        this.translateService.instant('task.calendar.dayAria', {
            day: longDayLabel(this.day()),
            count: this.items().length
        }) as string);

    readonly addLabel = computed(() =>
        this.translateService.instant('task.calendar.addOn', {date: longDayLabel(this.day())}) as string);

    /** Un jour passé n'accepte aucun dépôt. */
    readonly enterPredicate = (): boolean => !this.past();

    onDrop(event: CdkDragDrop<string>): void {
        this.dropped.emit(event);
    }

    /** Clic sur le fond de la case : ouvre l'ajout rapide. */
    onBackgroundClick(event: MouseEvent, host: HTMLElement): void {
        const target = event.target as HTMLElement | null;
        if (target?.closest('app-calendar-item, button, a')) {
            return;
        }

        this.addRequested.emit({day: this.day(), element: host});
    }

    onAddClick(event: MouseEvent, host: HTMLElement): void {
        event.stopPropagation();
        this.addRequested.emit({day: this.day(), element: host});
    }
}
