import {ChangeDetectionStrategy, Component, forwardRef, input, signal} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';

export interface ZoneCard {
    id: string;
    label: string;
    color: string;
    icon?: string | null;
    description?: string | null;
    daysLabel?: string | null;
    /** Avertissement doux si la zone a lieu un jour où le bénévole n'est pas disponible. */
    warning?: string | null;
}

/**
 * Cartes de zones à choix multiple (CVA sur `string[]` d'ids de catégories).
 */
@Component({
               selector: 'app-zone-picker',
               standalone: true,
               changeDetection: ChangeDetectionStrategy.OnPush,
               imports: [TranslatePipe],
               providers: [{
                   provide: NG_VALUE_ACCESSOR,
                   useExisting: forwardRef(() => ZonePickerComponent),
                   multi: true
               }],
               templateUrl: './zone-picker.component.html',
               styleUrl: './zone-picker.component.scss'
           })
export class ZonePickerComponent implements ControlValueAccessor {
    readonly zones = input.required<ZoneCard[]>();

    readonly selected = signal<Set<string>>(new Set());
    readonly disabled = signal<boolean>(false);

    private onChange: (value: string[]) => void = () => undefined;
    private onTouched: () => void = () => undefined;

    writeValue(value: string[] | null): void {
        this.selected.set(new Set(value ?? []));
    }

    registerOnChange(fn: (value: string[]) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled.set(isDisabled);
    }

    isSelected(id: string): boolean {
        return this.selected().has(id);
    }

    toggle(id: string): void {
        if (this.disabled()) {
            return;
        }
        const next = new Set(this.selected());
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        this.selected.set(next);
        this.onChange([...next]);
        this.onTouched();
    }
}
