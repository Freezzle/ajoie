import {
    ChangeDetectionStrategy,
    Component,
    computed,
    ElementRef,
    HostListener,
    inject,
    NgZone,
    OnDestroy,
    viewChild
} from '@angular/core';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {MessageService} from 'primeng/api';

import {VolunteerAvatarComponent} from './volunteer-avatar.component';
import {VolunteerPlanningStore} from '../volunteer-planning.store';
import {Category, Day} from '../volunteer-planning-model';
import {
    applyToolRange,
    changeRunCategory,
    deleteRun,
    formatHours,
    moveRun,
    NAME_COLUMN_WIDTH,
    Run,
    slotTime
} from '../volunteer-planning-utils';

type DragState =
    | { mode: 'create'; volunteerId: string; anchor: number; start: number; end: number; top: number }
    | { mode: 'move'; run: Run; offset: number; targetVolunteerId: string; newStart: number; moved: boolean; x0: number; y0: number; top: number }
    | { mode: 'resize'; run: Run; side: 'l' | 'r'; newStart: number; newEnd: number; top: number };

@Component({
               selector: 'planning-timeline',
               standalone: true,
               imports: [VolunteerAvatarComponent, TranslatePipe],
               templateUrl: './planning-timeline.component.html',
               styleUrls: ['./planning-timeline.component.scss'],
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class PlanningTimelineComponent implements OnDestroy {
    readonly store = inject(VolunteerPlanningStore);
    private readonly messageService = inject(MessageService);
    private readonly translate = inject(TranslateService);
    private readonly zone = inject(NgZone);

    private readonly rowsRef = viewChild.required<ElementRef<HTMLElement>>('rows');
    private readonly ghostRef = viewChild.required<ElementRef<HTMLElement>>('ghost');

    readonly nameWidth = NAME_COLUMN_WIDTH;

    readonly slotW = this.store.slotW;
    readonly slotWCss = this.store.slotWCss;
    readonly trackWidth = this.store.trackWidth;
    readonly volunteers = computed(() => this.store.visibleVolunteers());

    readonly band = computed(() => {
        const sel = this.store.zoneSelection();
        if (!sel) {
            return null;
        }
        const w = this.slotW();
        return {left: sel.start * w, width: (sel.end - sel.start + 1) * w};
    });

    private drag: DragState | null = null;
    private tracking = false;
    private rafId: number | null = null;
    private pendingMove: PointerEvent | null = null;

    // ---------- rendu ----------

    runsOf(volunteerId: string): Run[] {
        return this.store.runsByVolunteer().get(volunteerId) ?? [];
    }

    hoursOf(volunteerId: string): string {
        return formatHours(this.store.hoursByVolunteer().get(volunteerId) ?? 0);
    }

    isOvertime(volunteerId: string): boolean {
        return (this.store.hoursByVolunteer().get(volunteerId) ?? 0) > 6;
    }

    categoryOf(run: Run): Category | null {
        return run.categoryId ? (this.store.categoryMap().get(run.categoryId) ?? null) : null;
    }

    blockLeft(run: Run): number {
        return run.start * this.slotW() + 2;
    }

    blockWidth(run: Run): number {
        return (run.end - run.start) * this.slotW() - 4;
    }

    blockLabel(run: Run): string {
        return run.kind === 'UNAVAILABLE'
            ? String(this.translate.instant('planningVolunteers.palette.unavailable'))
            : (this.categoryOf(run)?.label ?? '');
    }

    blockTime(run: Run): string {
        const day = this.store.selectedDay();
        if (!day) {
            return '';
        }
        return `${slotTime(day, run.start)}–${slotTime(day, run.end)}`;
    }

    isSelectedRun(run: Run): boolean {
        const sel = this.store.blockSelection();
        return !!sel
            && sel.volunteerId === run.volunteerId
            && sel.start === run.start
            && sel.end === run.end
            && sel.kind === run.kind
            && sel.categoryId === run.categoryId;
    }

    isHighlighted(run: Run): boolean {
        const sel = this.store.zoneSelection();
        return !!sel
            && run.kind === 'CATEGORY'
            && run.categoryId === sel.categoryId
            && run.start <= sel.end
            && run.end > sel.start;
    }

    trackRun = (_: number, run: Run) => `${run.volunteerId}:${run.start}:${run.kind}:${run.categoryId ?? ''}`;

    runData(run: Run): string {
        return JSON.stringify(run);
    }

    // ---------- interactions ----------

    onNameClick(volunteerId: string): void {
        this.store.toggleFocus(volunteerId);
    }

    onPointerDown(event: PointerEvent): void {
        if (this.store.isReadOnly()) {
            return;
        }
        if (event.pointerType === 'mouse' && event.button !== 0) {
            return;
        }

        const target = event.target as HTMLElement;
        if (target.closest('.pop') || target.closest('.tl-name')) {
            return;
        }

        const track = target.closest<HTMLElement>('.track');
        if (!track) {
            return;
        }

        const day = this.store.selectedDay();
        if (!day) {
            return;
        }

        event.preventDefault();
        const w = this.slotW();
        const count = this.store.slotCount();
        const x = (event.clientX - track.getBoundingClientRect().left) / w;
        const top = track.offsetTop;

        const blockEl = target.closest<HTMLElement>('.blk');
        if (blockEl?.dataset['run']) {
            const run = JSON.parse(blockEl.dataset['run']) as Run;
            const handle = target.closest<HTMLElement>('.h');
            if (handle) {
                this.drag = {
                    mode: 'resize',
                    run,
                    side: handle.classList.contains('l') ? 'l' : 'r',
                    newStart: run.start,
                    newEnd: run.end,
                    top
                };
            } else {
                this.drag = {
                    mode: 'move',
                    run,
                    offset: Math.floor(x) - run.start,
                    targetVolunteerId: run.volunteerId,
                    newStart: run.start,
                    moved: false,
                    x0: event.clientX,
                    y0: event.clientY,
                    top
                };
            }
            this.startTracking();
            return;
        }

        if (this.store.blockSelection()) {
            this.store.blockSelection.set(null);
            return;
        }

        const tool = this.store.tool();
        if (tool.kind === 'NONE') {
            return;
        }

        const volunteerId = track.dataset['v'];
        if (!volunteerId) {
            return;
        }
        const slot = Math.max(0, Math.min(count - 1, Math.floor(x)));
        this.drag = {mode: 'create', volunteerId, anchor: slot, start: slot, end: slot + 1, top};
        this.showGhost();
        this.positionGhost(slot, slot + 1, top);
        this.startTracking();
    }

    private onPointerMove = (event: PointerEvent): void => {
        if (!this.drag) {
            return;
        }
        this.pendingMove = event;
        if (this.rafId !== null) {
            return;
        }
        this.rafId = requestAnimationFrame(() => {
            this.rafId = null;
            const ev = this.pendingMove;
            this.pendingMove = null;
            if (ev) {
                this.handleMove(ev);
            }
        });
    };

    /**
     * Le suivi du pointeur ne manipule que le DOM du fantôme : on l'enregistre hors zone Angular
     * et seulement pendant un geste, pour éviter un cycle de détection par `pointermove`.
     */
    private startTracking(): void {
        if (this.tracking) {
            return;
        }
        this.tracking = true;
        this.zone.runOutsideAngular(() => window.addEventListener('pointermove', this.onPointerMove));
    }

    private stopTracking(): void {
        if (!this.tracking) {
            return;
        }
        this.tracking = false;
        window.removeEventListener('pointermove', this.onPointerMove);
    }

    ngOnDestroy(): void {
        this.drag = null;
        this.stopTracking();
        this.cancelRaf();
    }

    private handleMove(event: PointerEvent): void {
        const drag = this.drag;
        if (!drag) {
            return;
        }
        const w = this.slotW();
        const count = this.store.slotCount();
        const rows = this.rowsRef().nativeElement;
        const originLeft = rows.getBoundingClientRect().left + this.nameWidth;

        if (drag.mode === 'create') {
            const slot = Math.max(0, Math.min(count - 1, Math.floor((event.clientX - originLeft) / w)));
            drag.start = Math.min(drag.anchor, slot);
            drag.end = Math.max(drag.anchor, slot) + 1;
            this.positionGhost(drag.start, drag.end, drag.top);
            return;
        }

        if (drag.mode === 'resize') {
            const x = Math.round((event.clientX - originLeft) / w);
            if (drag.side === 'l') {
                drag.newStart = Math.max(0, Math.min(drag.run.end - 1, x));
            } else {
                drag.newEnd = Math.max(drag.run.start + 1, Math.min(count, x));
            }
            this.showGhost();
            this.positionGhost(drag.newStart, drag.newEnd, drag.top);
            return;
        }

        // move
        if (!drag.moved) {
            if (Math.hypot(event.clientX - drag.x0, event.clientY - drag.y0) <= 5) {
                return;
            }
            drag.moved = true;
            this.store.blockSelection.set(null);
            this.showGhost();
        }

        const el = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
        const track = el?.closest<HTMLElement>('.track');
        if (track?.dataset['v']) {
            drag.targetVolunteerId = track.dataset['v']!;
            drag.top = track.offsetTop;
        }
        const length = drag.run.end - drag.run.start;
        drag.newStart = Math.max(0, Math.min(count - length, Math.floor((event.clientX - originLeft) / w) - drag.offset));
        this.positionGhost(drag.newStart, drag.newStart + length, drag.top);
    }

    @HostListener('window:pointerup')
    onPointerUp(): void {
        const drag = this.drag;
        this.drag = null;
        this.stopTracking();
        this.cancelRaf();
        this.hideGhost();
        if (!drag) {
            return;
        }

        if (drag.mode === 'create') {
            const tool = this.store.tool();
            this.store.updateDay(day => applyToolRange(day, drag.volunteerId, drag.start, drag.end, tool));
            return;
        }

        if (drag.mode === 'resize') {
            if (drag.newStart !== drag.run.start || drag.newEnd !== drag.run.end) {
                this.store.updateDay(day => moveRun(day, drag.run, drag.run.volunteerId, drag.newStart, drag.newEnd));
                this.store.blockSelection.set(null);
            }
            return;
        }

        // move
        if (!drag.moved) {
            this.store.blockSelection.set(this.isSelectedRun(drag.run) ? null : drag.run);
            return;
        }
        if (drag.targetVolunteerId === drag.run.volunteerId && drag.newStart === drag.run.start) {
            return;
        }
        const length = drag.run.end - drag.run.start;
        const before = this.store.selectedDay();
        this.store.updateDay(day => moveRun(day, drag.run, drag.targetVolunteerId, drag.newStart, drag.newStart + length));
        const applied = this.store.selectedDay() !== before;

        if (applied && drag.targetVolunteerId !== drag.run.volunteerId) {
            const name = this.store.planning().volunteers.find(v => v.id === drag.targetVolunteerId)?.label ?? '';
            this.messageService.add({
                                        severity: 'success',
                                        detail: this.translate.instant('planningVolunteers.toast.reassigned', {
                                            zone: this.blockLabel(drag.run),
                                            name
                                        }),
                                        life: 2000
                                    });
        }
    }

    @HostListener('window:pointercancel')
    @HostListener('window:blur')
    onPointerCancel(): void {
        this.drag = null;
        this.stopTracking();
        this.cancelRaf();
        this.hideGhost();
    }

    // ---------- popover ----------

    changeCategory(categoryId: string): void {
        const run = this.store.blockSelection();
        if (!run) {
            return;
        }
        this.store.updateDay((day: Day) => changeRunCategory(day, run, categoryId));
        this.store.blockSelection.set(null);
    }

    deleteSelectedBlock(): void {
        const run = this.store.blockSelection();
        if (!run) {
            return;
        }
        this.store.updateDay((day: Day) => deleteRun(day, run));
        this.store.blockSelection.set(null);
    }

    // ---------- fantôme ----------

    private showGhost(): void {
        const ghost = this.ghostRef().nativeElement;
        const tool = this.store.tool();
        const isUnavailable = this.drag?.mode === 'create'
            ? tool.kind === 'UNAVAILABLE'
            : (this.drag?.mode === 'move' || this.drag?.mode === 'resize') && this.drag.run.kind === 'UNAVAILABLE';

        ghost.classList.toggle('un', isUnavailable);
        if (!isUnavailable) {
            let color = '#dddddd';
            if (this.drag?.mode === 'create' && tool.kind === 'CATEGORY') {
                color = this.store.categoryMap().get(tool.categoryId)?.color ?? color;
            } else if (this.drag && this.drag.mode !== 'create') {
                color = this.categoryOf(this.drag.run)?.color ?? color;
            }
            ghost.style.setProperty('--c', color);
        }
        ghost.style.display = 'block';
    }

    private positionGhost(start: number, end: number, top: number): void {
        const ghost = this.ghostRef().nativeElement;
        const w = this.slotW();
        ghost.style.left = `${this.nameWidth + start * w + 2}px`;
        ghost.style.width = `${(end - start) * w - 4}px`;
        ghost.style.top = `${top + 6}px`;
    }

    private hideGhost(): void {
        const ghost = this.ghostRef().nativeElement;
        ghost.style.display = 'none';
    }

    private cancelRaf(): void {
        this.pendingMove = null;
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }
}
