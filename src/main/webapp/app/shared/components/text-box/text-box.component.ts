import {Component, Input, Self} from '@angular/core';
import {CommonModule} from '@angular/common';
import SharedModule from '../../shared.module';
import {ControlValueAccessor, FormControl, NgControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {ErrorModel} from '../../field-error/error.model';
import {ErrorBoxComponent} from '../../error-box/error-box.component';
import {InputText} from "primeng/inputtext";
import {IftaLabel} from "primeng/iftalabel";
import {FloatLabel} from "primeng/floatlabel";

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

    protected readonly Validators = Validators;

    disabled: boolean = false;
    value: string = '';

    // placeholder methods
    onChange = (_: any) => {
    };
    onTouched = () => {
    };

    constructor(@Self() public controlDir: NgControl) {
        this.controlDir.valueAccessor = this;
    }

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
        this.value = (event.target as HTMLInputElement).value;
        this.onChange(this.value);
        this.onTouched();
    }

    get control(): FormControl<any> {
        return this.controlDir.control as FormControl<any>;
    }

    protected readonly ErrorModel = ErrorModel;
}
