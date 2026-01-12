import {Component, Input, Self} from '@angular/core';
import {CommonModule} from '@angular/common';
import SharedModule from '../../shared.module';
import {ControlValueAccessor, FormControl, NgControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {ErrorModel} from '../../field-error/error.model';
import {ErrorBoxComponent} from '../../error-box/error-box.component';
import {IftaLabel} from 'primeng/iftalabel';
import {AutoComplete} from 'primeng/autocomplete';

@Component({
               imports: [CommonModule, SharedModule, ReactiveFormsModule, ErrorBoxComponent, IftaLabel, IftaLabel, AutoComplete],
               selector: 'chips-box',
               templateUrl: './chips-box.component.html'
           })
export class ChipsBoxComponent implements ControlValueAccessor {
    @Input()
    translateKey: string | undefined;
    @Input()
    fieldName: string = '';
    @Input()
    maxChips: number = 3;
    disabled: boolean = false;
    value: string = '';
    protected readonly Validators = Validators;
    protected readonly ErrorModel = ErrorModel;

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
