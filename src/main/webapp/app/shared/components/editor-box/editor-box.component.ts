import {Component, Input, Self} from '@angular/core';
import SharedModule from '../../shared.module';
import {ControlValueAccessor, FormControl, NgControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {ErrorBoxComponent} from '../../error-box/error-box.component';
import {Editor, EditorModule} from 'primeng/editor';

/**
 * Éditeur de texte riche (Quill via PrimeNG), pour les champs destinés à être affichés en HTML.
 */
@Component({
               imports: [SharedModule, ReactiveFormsModule, ErrorBoxComponent, EditorModule, Editor],
               selector: 'editor-box',
               templateUrl: './editor-box.component.html'
           })
export class EditorBoxComponent implements ControlValueAccessor {
    @Input()
    translateKey: string | undefined;

    @Input()
    fieldName: string = '';

    @Input()
    height: string = '220px';

    disabled: boolean = false;
    value: string = '';
    protected readonly Validators = Validators;

    constructor(@Self() public controlDir: NgControl) {
        this.controlDir.valueAccessor = this;
    }

    get control(): FormControl<any> {
        return this.controlDir.control as FormControl<any>;
    }

    // placeholder methods
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

    setDisabledState?(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }
}
