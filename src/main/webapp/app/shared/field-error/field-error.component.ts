import {Component, input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import SharedModule from '../shared.module';
import {ErrorModel} from './error.model';

@Component({
    imports: [CommonModule, SharedModule, ReactiveFormsModule],
    selector: 'field-error',
    standalone: true,
    templateUrl: './field-error.component.html',
})
export class FieldErrorComponent {
    formControlElement = input.required<FormControl>();
    errors = input<ErrorModel[]>();

    constructor() {
    }
}
