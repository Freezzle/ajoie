import {Component, EventEmitter, Input, Optional, Output, Self} from '@angular/core';
import {CommonModule} from '@angular/common';
import SharedModule from '../../shared.module';
import {ControlValueAccessor, FormControl, NgControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {ErrorModel} from '../../field-error/error.model';
import {ErrorBoxComponent} from '../../error-box/error-box.component';
import {InputText} from 'primeng/inputtext';
import {IftaLabel} from 'primeng/iftalabel';
import {FloatLabel} from 'primeng/floatlabel';

@Component({
               imports: [CommonModule, SharedModule, ReactiveFormsModule, ErrorBoxComponent, IftaLabel, InputText, IftaLabel, FloatLabel],
               selector: 'text-box',
               templateUrl: './text-box.component.html'
           })
export class TextBoxComponent implements ControlValueAccessor {
    @Input()
    translateKey: string | undefined;
    @Input()
    fieldName: string = '';
    @Input()
    maxLength: number = 255;
    @Input()
    value: string = '';
    @Output()
    valueChange = new EventEmitter<string>();

    disabled: boolean = false;
    protected readonly Validators = Validators;
    protected readonly ErrorModel = ErrorModel;

    constructor(@Self() @Optional() public controlDir: NgControl | null) {
        if (this.controlDir) {
            this.controlDir.valueAccessor = this;
        }
    }

    get control(): FormControl<any> | null {
        return this.controlDir?.control as FormControl<any> | null;
    }

    get isFormControl(): boolean {
        return this.controlDir !== null && this.controlDir.control !== null;
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

    onInput(event: Event) {
        const newValue = (event.target as HTMLInputElement).value;
        this.value = newValue;

        if (this.isFormControl) {
            this.onChange(newValue);
            this.onTouched();
        } else {
            this.valueChange.emit(newValue);
        }
    }
}
