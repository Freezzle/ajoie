import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    ElementRef,
    HostListener,
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
import {CardComponent} from '../../../shared/components/card/card.component';
import {
    SegmentedChoiceBoxComponent,
    SegmentedChoiceOption
} from '../../../shared/components/segmented-choice-box/segmented-choice-box.component';
import {ISalon} from '../../salon/model/salon.interface';
import {IFlatSubtask, ISubtaskInstance} from '../model/task-instance.interface';
import {TaskInstanceService} from '../service/task-instance.service';
import {UNDO_TOAST_KEY} from '../shared/subtask-status-panel.component';
import {effectiveDue, formatShortDate, toLocalDate, today} from '../shared/task-urgency.utils';
import {CalendarDayComponent} from './calendar-day.component';
import {CalendarItemComponent} from './calendar-item.component';
import {SubtaskEditRequest} from './calendar-quick-add.component';
import {
    activeCount,
    CalendarView,
    calendarRange,
    isSalonDay,
    lateSubtasks,
    longDayLabel,
    longWeekday,
    MAX_PER_DAY,
    monthTitle,
    shiftAnchor,
    shortDayMonth,
    shortWeekday,
    subtasksForDay
} from './task-calendar.utils';

/** Largeur en dessous de laquelle la grille laisse place à l'agenda. */
const NARROW_WIDTH = 600;

/** Affichage de l'agenda mobile. */
type AgendaMode = 'day' | 'list';

/**
 * Vue Calendrier : place les sous-tâches (déjà filtrées par l'écran parent) sur une
 * grille de jours, par semaine ou par mois, autour d'une date d'ancrage. En dessous
 * de 600 px, bascule sur un agenda de 7 jours. Glisser-déposer sur ordinateur pour
 * replanifier.
 */
@Component({
               selector: 'app-task-calendar',
               imports: [
                   SharedModule,
                   FormsModule,
                   CardComponent,
                   SegmentedChoiceBoxComponent,
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
    readonly view = input.required<CalendarView>();
    readonly anchor = input.required<string>();

    readonly viewChange = output<CalendarView>();
    readonly anchorChange = output<string>();
    readonly changed = output<ISubtaskInstance>();
    readonly editRequested = output<SubtaskEditRequest>();
    /** Demande d'ajout d'une sous-tâche sur un jour, ancrée sur un élément. */
    readonly addRequested = output<{day: string; element: HTMLElement}>();

    private readonly elementRef = inject(ElementRef<HTMLElement>);
    private readonly taskInstanceService = inject(TaskInstanceService);
    private readonly translateService = inject(TranslateService);
    private readonly messageService = inject(MessageService);

    readonly max = MAX_PER_DAY;
    readonly todayDate = today();

    /** Jours dépliés (au-delà de 4) ; remis à zéro quand la période change. */
    private readonly expandedDays = signal<Set<string>>(new Set());
    readonly narrow = signal<boolean>(false);
    readonly flashedId = signal<string | null>(null);

    /** Agenda mobile : jour sélectionné et mode d'affichage. */
    readonly agendaDay = signal<string>(this.todayDate);
    readonly agendaMode = signal<AgendaMode>('day');

    private resizeObserver?: ResizeObserver;

    readonly salonStart = computed(() => toLocalDate(this.salon()?.startingDate));
    readonly salonEnd = computed(() => toLocalDate(this.salon()?.endingDate));

    /** Sur mobile, la bande ne couvre jamais qu'une semaine. */
    readonly effectiveView = computed<CalendarView>(() => this.narrow() ? 'week' : this.view());

    readonly range = computed(() => calendarRange(this.effectiveView(), this.anchor()));

    /** Titre unique de l'en-tête : « Janvier 2027 » ou « Semaine 53 ». */
    readonly title = computed(() => {
        const range = this.range();

        return range.monthDate !== null
               ? monthTitle(range.monthDate)
               : this.text('task.calendar.weekTitle', {n: range.weekNumber});
    });

    /** En-têtes de colonnes : jour en toutes lettres, avec la date en vue Semaine. */
    readonly weekdayHeaders = computed(() =>
        this.range().days.slice(0, 7).map(day => ({
            label: longWeekday(day),
            date: this.effectiveView() === 'week' ? shortDayMonth(day) : null
        })));

    readonly grouped = computed(() => {
        const range = this.range();
        const subtasks = this.subtasks();

        return range.days.map(day => ({
            day,
            items: subtasksForDay(subtasks, day)
        }));
    });

    readonly late = computed(() => lateSubtasks(this.subtasks(), this.todayDate));

    readonly isEmpty = computed(() =>
        this.late().length === 0 && this.grouped().every(cell => cell.items.length === 0));

    /** Agenda mobile : les 7 jours de la semaine affichée. */
    readonly agendaDays = computed(() => this.range().days);

    readonly agendaDayItems = computed(() => subtasksForDay(this.subtasks(), this.agendaDay()));

    readonly agendaListDays = computed(() =>
        this.agendaDays()
            .map(day => ({day, items: subtasksForDay(this.subtasks(), day)}))
            .filter(cell => cell.items.length > 0));

    constructor() {
        // Changer de période replie tous les jours.
        effect(() => {
            this.view();
            this.anchor();
            untracked(() => this.expandedDays.set(new Set()));
        });

        // Garder le jour d'agenda dans la semaine affichée.
        effect(() => {
            const days = this.agendaDays();
            untracked(() => {
                if (!days.includes(this.agendaDay())) {
                    this.agendaDay.set(days.includes(this.todayDate) ? this.todayDate : days[0]);
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

    // ── Navigation ───────────────────────────────────────────────────────────

    readonly viewOptions: SegmentedChoiceOption[] = [
        {value: 'week', titleKey: 'task.calendar.viewWeek'},
        {value: 'month', titleKey: 'task.calendar.viewMonth'}
    ];

    /** Vrai quand la période affichée contient aujourd'hui. */
    readonly onToday = computed(() => {
        const range = this.range();

        return this.todayDate >= range.start && this.todayDate <= range.end;
    });

    /** Vrai quand le salon a une date et n'est pas déjà affiché. */
    readonly canGoSalon = computed(() => {
        const start = this.salonStart();
        const range = this.range();

        return !!start && !(start >= range.start && start <= range.end);
    });

    get previousLabelKey(): string {
        return this.effectiveView() === 'week' ? 'task.calendar.previousWeek' : 'task.calendar.previousMonth';
    }

    get nextLabelKey(): string {
        return this.effectiveView() === 'week' ? 'task.calendar.nextWeek' : 'task.calendar.nextMonth';
    }

    selectView(view: string | null): void {
        if ((view === 'week' || view === 'month') && view !== this.view()) {
            this.viewChange.emit(view);
        }
    }

    shift(direction: -1 | 1): void {
        this.anchorChange.emit(shiftAnchor(this.effectiveView(), this.anchor(), direction));
    }

    goToday(): void {
        this.anchorChange.emit(this.todayDate);
    }

    goSalon(): void {
        const start = this.salonStart();
        if (start) {
            this.anchorChange.emit(start);
        }
    }

    /** ← et → changent de période, sauf pendant une saisie ou dans un panneau. */
    @HostListener('document:keydown', ['$event'])
    onKeydown(event: KeyboardEvent): void {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
            return;
        }
        if (event.altKey || event.ctrlKey || event.metaKey || this.isTypingTarget(event.target)) {
            return;
        }

        event.preventDefault();
        this.shift(event.key === 'ArrowLeft' ? -1 : 1);
    }

    private isTypingTarget(target: EventTarget | null): boolean {
        if (!(target instanceof HTMLElement)) {
            return false;
        }

        return target.isContentEditable ||
               ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
               target.closest('[role="radiogroup"], .p-overlay, .p-popover, .p-datepicker, .p-select') !== null;
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
        return activeCount(subtasksForDay(this.subtasks(), day));
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

    onAddRequested(event: {day: string; element: HTMLElement}): void {
        this.addRequested.emit(event);
    }

    onChanged(subtask: ISubtaskInstance): void {
        this.flash(subtask.id);
        this.changed.emit(subtask);
    }

    onEdit(request: SubtaskEditRequest): void {
        this.editRequested.emit(request);
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
