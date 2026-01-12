import {Component, input} from '@angular/core';

import {FormControl, ReactiveFormsModule} from '@angular/forms';
import SharedModule from '../shared.module';
import {ErrorModel} from './error.model';

@Component({
               imports: [SharedModule, ReactiveFormsModule],
               selector: 'field-error',
               templateUrl: './field-error.component.html',
               styleUrl: './field-error.component.scss'
           })
export class FieldErrorComponent {
    formControlElement = input.required<FormControl>();
    errors = input<ErrorModel[]>();

    constructor() {
    }
}
