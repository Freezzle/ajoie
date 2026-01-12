import {Component, Input, Self} from '@angular/core';
import {CommonModule} from '@angular/common';
import SharedModule from '../../shared.module';
import {ControlValueAccessor, FormControl, NgControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {ErrorBoxComponent} from '../../error-box/error-box.component';
import {IftaLabel} from 'primeng/iftalabel';
import {Textarea} from 'primeng/textarea';

@Component({
               imports: [CommonModule, SharedModule, ReactiveFormsModule, ErrorBoxComponent, IftaLabel, Textarea],
               selector: 'textarea-box',
               templateUrl: './textarea-box.component.html'
           })
export class TextareaBoxComponent implements ControlValueAccessor {
    @Input()
    translateKey: string | undefined;

    @Input()
    fieldName: string = '';

    @Input()
    rows: number = 3;

    @Input()
    showCounter = false;

    @Input()
    maxLength: number | undefined;
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

    onInput(event: Event) {
        this.value = (event.target as HTMLInputElement).value;
        this.onChange(this.value);
        this.onTouched();
    }
}
