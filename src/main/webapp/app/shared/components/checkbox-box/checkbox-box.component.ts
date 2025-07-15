import {Component, EventEmitter, Input, OnInit, Optional, Output, Self} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
    ControlValueAccessor,
    FormControl,
    FormsModule,
    NgControl,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import SharedModule from '../../shared.module';
import {ToggleButton} from "primeng/togglebutton";

@Component({
    imports: [CommonModule, ReactiveFormsModule, FormsModule, SharedModule, ToggleButton],
    selector: 'checkbox-box',
    templateUrl: './checkbox-box.component.html'
})
export class CheckboxBoxComponent implements ControlValueAccessor, OnInit {
    @Input() translateKey?: string;
    @Input() fieldName: string = '';
    @Input() value: boolean = false;
    @Input() forceDisabled: boolean = false;
    @Output() onValueChange = new EventEmitter<void>;

    isFormControlUsed: boolean = false; // Détecter l'utilisation du formControl
    disabled: boolean = false;

    onChange = (_: any) => {
    };
    onTouched = () => {
    };

    constructor(@Self() @Optional() public controlDir: NgControl) {
        if (this.controlDir) {
            this.controlDir.valueAccessor = this;
            this.isFormControlUsed = true;
        }
    }

    ngOnInit() {
        if (this.isFormControlUsed && this.controlDir?.control) {
            // Initialiser la valeur si un formControl est utilisé
            this.value = this.controlDir.control.value ?? false;
        }
    }

    writeValue(value: boolean): void {
        this.value = value;
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState?(isDisabled: boolean): void {
        this.disabled = this.forceDisabled || isDisabled;
    }

    onInput(event: Event) {
        const newValue = (event.target as HTMLInputElement).checked;
        this.value = newValue;
        this.onChange(newValue);
        this.onTouched();
        this.onValueChange.emit();
    }

    get control(): FormControl<any> {
        return this.controlDir.control as FormControl<any>;
    }

    protected readonly Validators = Validators;
}
