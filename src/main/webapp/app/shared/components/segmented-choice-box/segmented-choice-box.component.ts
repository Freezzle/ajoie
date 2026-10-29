import {ChangeDetectionStrategy, Component, forwardRef, input, signal} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';

export interface SegmentedChoiceOption {
    value: string;
    titleKey: string;
    subtitleKey?: string;
}

/**
 * Interrupteur à deux options (type segmented control), CVA sur une valeur parmi des options.
 * `role="radiogroup"`, flèches gauche/droite pour changer de choix.
 */
@Component({
               selector: 'segmented-choice-box',
               standalone: true,
               changeDetection: ChangeDetectionStrategy.OnPush,
               imports: [TranslatePipe],
               providers: [{
                   provide: NG_VALUE_ACCESSOR,
                   useExisting: forwardRef(() => SegmentedChoiceBoxComponent),
                   multi: true
               }],
               templateUrl: './segmented-choice-box.component.html',
               styleUrl: './segmented-choice-box.component.scss'
           })
export class SegmentedChoiceBoxComponent implements ControlValueAccessor {
    readonly options = input.required<SegmentedChoiceOption[]>();
    readonly labelledBy = input<string | null>(null);

    readonly value = signal<string | null>(null);
    readonly disabled = signal<boolean>(false);

    private onChange: (value: string | null) => void = () => undefined;
    private onTouched: () => void = () => undefined;

    writeValue(value: string | null): void {
        this.value.set(value ?? null);
    }

    registerOnChange(fn: (value: string | null) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled.set(isDisabled);
    }

    select(value: string): void {
        if (this.disabled()) {
            return;
        }
        this.value.set(value);
        this.onChange(value);
        this.onTouched();
    }

    onKeydown(event: KeyboardEvent): void {
        if (this.disabled()) {
            return;
        }
        const options = this.options();
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
            return;
        }
        event.preventDefault();
        const currentIndex = Math.max(0, options.findIndex(o => o.value === this.value()));
        const delta = event.key === 'ArrowRight' ? 1 : -1;
        const next = (currentIndex + delta + options.length) % options.length;
        this.select(options[next].value);
    }
}
