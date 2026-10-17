import {Component, Input, Optional, Self} from '@angular/core';
import {ControlValueAccessor, FormControl, NgControl, ReactiveFormsModule} from '@angular/forms';

import SharedModule from '../../shared.module';
import {ErrorBoxComponent} from '../../error-box/error-box.component';

/**
 * Groupe de boutons radio accessible (role="radiogroup" + vrais input[type=radio]).
 * Même API que les autres composants de champ (fieldName / translateKey / formatterFunction).
 */
@Component({
               imports: [SharedModule, ReactiveFormsModule, ErrorBoxComponent],
               selector: 'radio-box',
               templateUrl: './radio-box.component.html',
               styleUrl: './radio-box.component.scss'
           })
export class RadioBoxComponent implements ControlValueAccessor {
    @Input() translateKey: string | undefined;
    @Input() fieldName: string = '';
    @Input() options: any[] = [];
    @Input() needTranslation: boolean = true;

    @Input()
    formatterFunction: (option: any) => string = (option: any) => String(option ?? '');

    /** Libellé secondaire par option (ex. un supplément de prix). Retourner null pour ne rien afficher. */
    @Input()
    hintFunction: (option: any) => string | null = () => null;

    value: any = null;
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

    writeValue(value: any): void {
        this.value = value;
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

    select(option: any): void {
        if (this.disabled) {
            return;
        }
        this.value = option;
        this.onChange(option);
        this.onTouched();
    }

    getLabel(option: any): string {
        return this.formatterFunction(option);
    }

    getHint(option: any): string | null {
        return this.hintFunction(option);
    }
}
