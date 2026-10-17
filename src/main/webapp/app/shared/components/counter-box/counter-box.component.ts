import {Component, Input, Optional, Self} from '@angular/core';
import {ControlValueAccessor, FormControl, NgControl, ReactiveFormsModule} from '@angular/forms';

import SharedModule from '../../shared.module';
import {ErrorBoxComponent} from '../../error-box/error-box.component';

/**
 * Compteur −/+ accessible, utilisable avec un formControl.
 * Même API que les autres composants de champ (fieldName / translateKey).
 */
@Component({
               imports: [SharedModule, ReactiveFormsModule, ErrorBoxComponent],
               selector: 'counter-box',
               templateUrl: './counter-box.component.html',
               styleUrl: './counter-box.component.scss'
           })
export class CounterBoxComponent implements ControlValueAccessor {
    @Input() translateKey: string | undefined;
    @Input() fieldName: string = '';
    @Input() minValue: number = 0;
    @Input() maxValue: number = 99;
    /** Libellé secondaire affiché sous l'intitulé (ex. un prix unitaire). */
    @Input() hint: string | null = null;

    value: number = 0;
    disabled: boolean = false;

    constructor(@Self() @Optional() public controlDir: NgControl | null) {
        if (this.controlDir) {
            this.controlDir.valueAccessor = this;
        }
    }

    get control(): FormControl<any> | null {
        return this.controlDir?.control as FormControl<any> | null;
    }

    onChange = (_: any) => {
    };

    onTouched = () => {
    };

    writeValue(value: number | null): void {
        this.value = value ?? this.minValue;
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    increment(): void {
        this.setValue(this.value + 1);
    }

    decrement(): void {
        this.setValue(this.value - 1);
    }

    onInput(event: Event): void {
        const parsed = Number.parseInt((event.target as HTMLInputElement).value, 10);
        this.setValue(Number.isNaN(parsed) ? this.minValue : parsed);
    }

    private setValue(next: number): void {
        if (this.disabled) {
            return;
        }
        this.value = Math.min(this.maxValue, Math.max(this.minValue, next));
        this.onChange(this.value);
        this.onTouched();
    }
}
