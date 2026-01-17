import {Component, Input, OnInit, Optional, Self} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
    ControlValueAccessor,
    FormControl,
    FormsModule,
    NgControl,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';
import {ToggleButton} from 'primeng/togglebutton';
import {PrimeIcons} from 'primeng/api';
import {Rating} from 'primeng/rating';
import {IftaLabel} from 'primeng/iftalabel';
import SharedModule from '../shared.module';

@Component({
               imports: [CommonModule, ReactiveFormsModule, FormsModule, ToggleButton, Rating, IftaLabel, SharedModule],
               selector: 'rating-box',
               templateUrl: './rating-box.component.html',
               styleUrl: './rating-box.component.scss'
           })
export class RatingBoxComponent implements ControlValueAccessor, OnInit {
    @Input() translateKey?: string;
    @Input() fieldName: string = '';
    @Input() value: number | undefined = undefined;
    @Input() forceDisabled: boolean = false;

    isFormControlUsed: boolean = false; // Détecter l'utilisation du formControl
    disabled: boolean = false;
    protected readonly Validators = Validators;
    protected readonly PrimeIcons = PrimeIcons;

    constructor(@Self() @Optional() public controlDir: NgControl) {
        if (this.controlDir) {
            this.controlDir.valueAccessor = this;
            this.isFormControlUsed = true;
        }
    }

    get control(): FormControl<any> {
        return this.controlDir.control as FormControl<any>;
    }

    onChange = (_: any) => {
    };

    onTouched = () => {
    };

    ngOnInit() {
        if (this.isFormControlUsed && this.controlDir?.control) {
            // Initialiser la valeur si un formControl est utilisé
            this.value = this.controlDir.control.value ?? undefined;
        }
    }

    writeValue(value: number): void {
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
}
