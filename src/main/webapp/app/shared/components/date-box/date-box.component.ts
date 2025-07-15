import {Component, Input, Self} from '@angular/core';
import {CommonModule} from '@angular/common';
import SharedModule from '../../shared.module';
import {ControlValueAccessor, FormControl, NgControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {ErrorBoxComponent} from '../../error-box/error-box.component';
import {IftaLabel} from "primeng/iftalabel";
import {DatePicker} from "primeng/datepicker";

@Component({
    imports: [CommonModule, SharedModule, ReactiveFormsModule, ErrorBoxComponent, IftaLabel, DatePicker],
    selector: 'date-box',
    templateUrl: './date-box.component.html'
})
export class DateBoxComponent implements ControlValueAccessor {
    @Input()
    translateKey: string | undefined;

    @Input()
    fieldName: string = '';

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

    get control(): FormControl<Date> {
        return this.controlDir.control as FormControl<Date>;
    }
}
