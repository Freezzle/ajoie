import {
    ChangeDetectionStrategy,
    Component,
    computed,
    ElementRef,
    forwardRef,
    input,
    signal,
    ViewChild
} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';

import {
    FriseSlot,
    Preset,
    presetsFor,
    runsToRanges,
    toggleRange,
    totalHours
} from '../volunteer-availability.util';

interface RangePill {
    label: string;
    hours: number;
    from: number;
    to: number; // inclus
}

/**
 * Frise à peindre : sélection des heures de disponibilité d'un jour par glisser (souris/doigt),
 * tap, raccourcis et clavier. CVA sur `number[]` (indexes des cases choisies).
 */
@Component({
               selector: 'app-availability-frise',
               standalone: true,
               changeDetection: ChangeDetectionStrategy.OnPush,
               imports: [TranslatePipe],
               providers: [{
                   provide: NG_VALUE_ACCESSOR,
                   useExisting: forwardRef(() => AvailabilityFriseComponent),
                   multi: true
               }],
               templateUrl: './availability-frise.component.html',
               styleUrl: './availability-frise.component.scss'
           })
export class AvailabilityFriseComponent implements ControlValueAccessor {
    @ViewChild('track') trackRef?: ElementRef<HTMLElement>;

    readonly slots = input.required<FriseSlot[]>();
    readonly dayLabel = input<string>('');
    readonly disabledInput = input<boolean>(false, {alias: 'disabled'});

    readonly selected = signal<Set<number>>(new Set());
    readonly disabled = signal<boolean>(false);
    readonly focusedIndex = signal<number>(0);

    readonly presets = computed<Preset[]>(() => presetsFor(this.slots()));
    readonly total = computed(() => totalHours(this.slots(), [...this.selected()]));

    readonly pills = computed<RangePill[]>(() => {
        const slots = this.slots();
        const indexes = [...this.selected()];
        return runsToRanges(slots, indexes).map(range => {
            const from = slots.findIndex(s => s.start === range.start);
            const to = slots.reduce((acc, s, i) => (s.end === range.end ? i : acc), from);
            return {
                label: `${range.start} – ${range.end}`,
                hours: totalHours(slots, this.indexesBetween(from, to)),
                from,
                to
            };
        });
    });

    private painting = false;
    private paintValue = true;
    private startIndex: number | null = null;
    private moved = false;
    private suppressClick = false;

    private onChange: (value: number[]) => void = () => undefined;
    private onTouched: () => void = () => undefined;

    writeValue(value: number[] | null): void {
        this.selected.set(new Set(value ?? []));
    }

    registerOnChange(fn: (value: number[]) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled.set(isDisabled);
    }

    isDisabled(): boolean {
        return this.disabled() || this.disabledInput();
    }

    isSelected(index: number): boolean {
        return this.selected().has(index);
    }

    /** Une case choisie est "liée" à sa voisine de gauche/droite si elle aussi est choisie. */
    joinedLeft(index: number): boolean {
        return this.isSelected(index) && this.isSelected(index - 1);
    }

    joinedRight(index: number): boolean {
        return this.isSelected(index) && this.isSelected(index + 1);
    }

    // -------------------- RACCOURCIS --------------------

    isPresetActive(preset: Preset): boolean {
        for (let i = preset.from; i <= preset.to; i++) {
            if (!this.selected().has(i)) {
                return false;
            }
        }
        return true;
    }

    presetRangeLabel(preset: Preset): string {
        const slots = this.slots();
        const from = slots[preset.from];
        const to = slots[preset.to];
        return from && to ? `${from.start.slice(0, 5)}–${to.end.slice(0, 5)}` : '';
    }

    togglePreset(preset: Preset): void {
        if (this.isDisabled()) {
            return;
        }
        this.commit(toggleRange([...this.selected()], preset.from, preset.to));
    }

    // -------------------- POINTER --------------------

    onPointerDown(event: PointerEvent, index: number): void {
        if (this.isDisabled()) {
            return;
        }
        this.painting = true;
        this.moved = false;
        this.startIndex = index;
        this.paintValue = !this.selected().has(index);
        this.focusedIndex.set(index);
        (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
    }

    onPointerMove(event: PointerEvent): void {
        if (!this.painting || this.startIndex === null) {
            return;
        }
        const index = this.cellIndexAt(event.clientX, event.clientY);
        if (index === null) {
            return;
        }
        if (!this.moved) {
            this.moved = true;
        }
        const next = new Set(this.selected());
        const lo = Math.min(this.startIndex, index);
        const hi = Math.max(this.startIndex, index);
        for (let i = lo; i <= hi; i++) {
            if (this.paintValue) {
                next.add(i);
            } else {
                next.delete(i);
            }
        }
        this.selected.set(next);
    }

    onPointerUp(): void {
        if (!this.painting || this.startIndex === null) {
            return;
        }
        if (!this.moved) {
            // simple tap : bascule la case de départ
            const next = new Set(this.selected());
            if (next.has(this.startIndex)) {
                next.delete(this.startIndex);
            } else {
                next.add(this.startIndex);
            }
            this.selected.set(next);
        }
        this.painting = false;
        this.startIndex = null;
        this.suppressClick = this.moved;
        this.commit([...this.selected()]);
    }

    onClick(event: Event): void {
        if (this.suppressClick) {
            event.preventDefault();
            event.stopPropagation();
            this.suppressClick = false;
        }
    }

    removePill(pill: RangePill): void {
        if (this.isDisabled()) {
            return;
        }
        const next = new Set(this.selected());
        for (let i = pill.from; i <= pill.to; i++) {
            next.delete(i);
        }
        this.commit([...next]);
    }

    // -------------------- CLAVIER --------------------

    onKeydown(event: KeyboardEvent, index: number): void {
        if (this.isDisabled()) {
            return;
        }
        const count = this.slots().length;
        switch (event.key) {
            case 'ArrowRight':
                event.preventDefault();
                this.moveFocus(Math.min(count - 1, index + 1), event.shiftKey, index);
                break;
            case 'ArrowLeft':
                event.preventDefault();
                this.moveFocus(Math.max(0, index - 1), event.shiftKey, index);
                break;
            case ' ':
            case 'Enter':
                event.preventDefault();
                this.toggleOne(index);
                break;
            default:
                break;
        }
    }

    private moveFocus(target: number, extend: boolean, from: number): void {
        this.focusedIndex.set(target);
        if (extend) {
            this.commit(toggleRange([...this.selected()], from, target));
        }
        queueMicrotask(() => {
            this.trackRef?.nativeElement
                .querySelector<HTMLElement>(`[data-index="${target}"]`)?.focus();
        });
    }

    private toggleOne(index: number): void {
        const next = new Set(this.selected());
        if (next.has(index)) {
            next.delete(index);
        } else {
            next.add(index);
        }
        this.commit([...next]);
    }

    // -------------------- UTILS --------------------

    private cellIndexAt(x: number, y: number): number | null {
        const track = this.trackRef?.nativeElement;
        if (!track) {
            return null;
        }
        const el = document.elementFromPoint(x, y) as HTMLElement | null;
        if (!el || !track.contains(el)) {
            return null;
        }
        const cell = el.closest<HTMLElement>('[data-index]');
        if (!cell) {
            return null;
        }
        const index = Number(cell.dataset['index']);
        return Number.isNaN(index) ? null : index;
    }

    private indexesBetween(from: number, to: number): number[] {
        const out: number[] = [];
        for (let i = from; i <= to; i++) {
            out.push(i);
        }
        return out;
    }

    private commit(indexes: number[]): void {
        const sorted = [...new Set(indexes)].sort((a, b) => a - b);
        this.selected.set(new Set(sorted));
        this.onChange(sorted);
        this.onTouched();
    }
}
