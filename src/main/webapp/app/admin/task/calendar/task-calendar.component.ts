import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    ElementRef,
    inject,
    input,
    OnDestroy,
    output,
    signal,
    untracked
} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup} from '@angular/cdk/drag-drop';
import {MessageService} from 'primeng/api';
import {TranslateService} from '@ngx-translate/core';

import SharedModule from '../../../shared/shared.module';
import {ISalon} from '../../salon/model/salon.interface';
import {IFlatSubtask, ISubtaskInstance} from '../model/task-instance.interface';
import {TaskInstanceService} from '../service/task-instance.service';
import {UNDO_TOAST_KEY} from '../shared/subtask-status-panel.component';
import {effectiveDue, formatShortDate, toLocalDate, today} from '../shared/task-urgency.utils';
import {CalendarDayComponent} from './calendar-day.component';
import {CalendarItemComponent} from './calendar-item.component';
import {
    activeCount,
    calendarCounts,
    calendarRange,
    isSalonDay,
    lateSubtasks,
    longDayLabel,
    MAX_PER_DAY,
    shortWeekday,
    subtasksForDay,
    WEEK_OPTIONS
} from './task-calendar.utils';

/** Largeur en dessous de laquelle la grille laisse place à l'agenda. */
const NARROW_WIDTH = 600;

/** Affichage de l'agenda mobile. */
type AgendaMode = 'day' | 'list';

/**
 * Vue Calendrier : place les sous-tâches (déjà filtrées par l'écran parent) sur une
 * grille de jours, du lundi de la semaine en cours à N semaines plus tard. En dessous
 * de 600 px, bascule sur un agenda. Glisser-déposer sur ordinateur pour replanifier.
 */
@Component({
               selector: 'app-task-calendar',
               imports: [
                   SharedModule,
                   FormsModule,
                   CdkDropListGroup,
                   CdkDropList,
                   CdkDrag,
                   CalendarDayComponent,
                   CalendarItemComponent
               ],
               templateUrl: './task-calendar.component.html',
               styleUrl: './task-calendar.component.scss',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class TaskCalendarComponent implements AfterViewInit, OnDestroy {
    readonly subtasks = input<IFlatSubtask[]>([]);
    readonly salon = input<ISalon | null>(null);
    readonly known = input<string[]>([]);
    readonly weeks = input.required<number>();

    readonly weeksChange = output<number>();
    readonly changed = output<ISubtaskInstance>();
    readonly editRequested = output<ISubtaskInstance>();

    private readonly elementRef = inject(ElementRef<HTMLElement>);
    private readonly taskInstanceService = inject(TaskInstanceService);
    private readonly translateService = inject(TranslateService);
    private readonly messageService = inject(MessageService);

    readonly weekOptions = WEEK_OPTIONS;
    readonly max = MAX_PER_DAY;
    readonly todayDate = today();

    /** Jours dépliés (au-delà de 4) ; remis à zéro quand le nombre de semaines change. */
    private readonly expandedDays = signal<Set<string>>(new Set());
    readonly narrow = signal<boolean>(false);
    readonly flashedId = signal<string | null>(null);

    /** Agenda mobile : jour sélectionné et mode d'affichage. */
    readonly agendaDay = signal<string>(this.todayDate);
    readonly agendaMode = signal<AgendaMode>('day');

    private resizeObserver?: ResizeObserver;

    readonly salonStart = computed(() => toLocalDate(this.salon()?.startingDate));
    readonly salonEnd = computed(() => toLocalDate(this.salon()?.endingDate));

    readonly range = computed(() => calendarRange(this.weeks(), this.todayDate));

    readonly weekdayHeaders = computed(() =>
        this.range().days.slice(0, 7).map(day => this.capitalize(shortWeekday(day))));

    readonly grouped = computed(() => {
        const range = this.range();
        const subtasks = this.subtasks();

        return range.days.map(day => ({
            day,
            items: subtasksForDay(subtasks, day, this.todayDate)
        }));
    });

    readonly late = computed(() => lateSubtasks(this.subtasks(), this.todayDate));

    readonly counts = computed(() => calendarCounts(this.subtasks(), this.range(), this.todayDate));

    readonly rangeLabel = computed(() =>
        this.translateService.instant('task.calendar.range', {
            from: formatShortDate(this.range().start),
            to: formatShortDate(this.range().end)
        }) as string);

    readonly isEmpty = computed(() =>
        this.late().length === 0 && this.grouped().every(cell => cell.items.length === 0));

    /** Jours de l'agenda : d'aujourd'hui à la fin de la période. */
    readonly agendaDays = computed(() => this.range().days.filter(day => day >= this.todayDate));

    readonly agendaDayItems = computed(() => subtasksForDay(this.subtasks(), this.agendaDay(), this.todayDate));

    readonly agendaListDays = computed(() =>
        this.agendaDays()
            .map(day => ({day, items: subtasksForDay(this.subtasks(), day, this.todayDate)}))
            .filter(cell => cell.items.length > 0));

    constructor() {
        // Changer le nombre de semaines replie tous les jours.
        effect(() => {
            this.weeks();
            untracked(() => this.expandedDays.set(new Set()));
        });

        // Garder le jour d'agenda dans la période affichée.
        effect(() => {
            const days = this.agendaDays();
            untracked(() => {
                if (!days.includes(this.agendaDay())) {
                    this.agendaDay.set(days[0] ?? this.todayDate);
                }
            });
        });
    }

    ngAfterViewInit(): void {
        if (typeof ResizeObserver === 'undefined') {
            return;
        }

        this.resizeObserver = new ResizeObserver(entries => {
            const width = entries[0]?.contentRect.width ?? 0;
            this.narrow.set(width > 0 && width <= NARROW_WIDTH);
        });
        this.resizeObserver.observe(this.elementRef.nativeElement);
    }

    ngOnDestroy(): void {
        this.resizeObserver?.disconnect();
    }

    /** Un jour passé n'accepte aucun dépôt. */
    readonly never = (): boolean => false;

    // ── Semaines ─────────────────────────────────────────────────────────────

    isSelectedWeeks(weeks: number): boolean {
        return this.weeks() === weeks;
    }

    selectWeeks(weeks: number): void {
        if (weeks !== this.weeks()) {
            this.weeksChange.emit(weeks);
        }
    }

    // ── Jours dépliés ────────────────────────────────────────────────────────

    isExpanded(day: string): boolean {
        return this.expandedDays().has(day);
    }

    toggleExpand(day: string): void {
        this.expandedDays.update(set => {
            const next = new Set(set);
            if (next.has(day)) {
                next.delete(day);
            } else {
                next.add(day);
            }

            return next;
        });
    }

    // ── Agenda mobile ────────────────────────────────────────────────────────

    selectAgendaDay(day: string): void {
        this.agendaDay.set(day);
    }

    setAgendaMode(mode: AgendaMode): void {
        this.agendaMode.set(mode);
    }

    agendaDayLabel(day: string): string {
        return day === this.todayDate ? this.text('task.calendar.todayTag') : longDayLabel(day);
    }

    agendaShortDay(day: string): string {
        return day === this.todayDate ? this.text('task.calendar.todayShort') : this.capitalize(shortWeekday(day));
    }

    agendaActiveCount(day: string): number {
        return activeCount(subtasksForDay(this.subtasks(), day, this.todayDate));
    }

    dayNumberOf(day: string): number {
        return new Date(`${day}T00:00:00`).getDate();
    }

    isAgendaSalon(day: string): boolean {
        return isSalonDay(day, this.salonStart(), this.salonEnd());
    }

    isAgendaSalonStart(day: string): boolean {
        return this.isAgendaSalon(day) && day === this.salonStart();
    }

    // ── Glisser-déposer ──────────────────────────────────────────────────────

    onDrop(event: CdkDragDrop<string>): void {
        if (event.previousContainer === event.container) {
            return;
        }

        const subtask = event.item.data as IFlatSubtask;
        const targetDay = event.container.data;

        if (!targetDay || effectiveDue(subtask) === targetDay) {
            return;
        }

        const backToOrigin = targetDay === subtask.dueDate;
        const patch: Partial<ISubtaskInstance> = backToOrigin
            ? {snoozeUntilType: null, snoozedUntil: null, snoozeOffset: null}
            : {snoozeUntilType: 'FIXED', snoozedUntil: targetDay, snoozeOffset: null};

        const previous: Partial<ISubtaskInstance> = {
            snoozeUntilType: subtask.snoozeUntilType,
            snoozedUntil: subtask.snoozedUntil,
            snoozeOffset: subtask.snoozeOffset
        };

        this.taskInstanceService.patchSubtask(subtask.id, patch).subscribe(updated => {
            this.flash(updated.id);
            this.changed.emit(updated);

            const message = backToOrigin
                            ? this.text('task.panel.restored')
                            : this.text('task.panel.pushed', {label: formatShortDate(targetDay)});

            this.toast(message, () =>
                this.taskInstanceService.patchSubtask(subtask.id, previous)
                    .subscribe(reverted => this.changed.emit(reverted)));
        });
    }

    // ── Relais des évènements d'un élément ──────────────────────────────────

    onChanged(subtask: ISubtaskInstance): void {
        this.flash(subtask.id);
        this.changed.emit(subtask);
    }

    onEdit(subtask: ISubtaskInstance): void {
        this.editRequested.emit(subtask);
    }

    private flash(id: string): void {
        this.flashedId.set(id);
        setTimeout(() => {
            if (this.flashedId() === id) {
                this.flashedId.set(null);
            }
        }, 1300);
    }

    private toast(summary: string, undo?: () => void): void {
        this.messageService.add({
                                    key: UNDO_TOAST_KEY,
                                    severity: 'success',
                                    summary,
                                    life: 6000,
                                    data: undo ? {undo} : undefined
                                });
    }

    private capitalize(value: string): string {
        return value.charAt(0).toLocaleUpperCase('fr') + value.slice(1);
    }

    private text(key: string, params?: object): string {
        return this.translateService.instant(key, params) as string;
    }
}
