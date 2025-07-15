import {Component, input} from '@angular/core';

import {FormControl, ReactiveFormsModule} from '@angular/forms';
import SharedModule from '../shared.module';
import {Message} from "primeng/message";

@Component({
    imports: [SharedModule, ReactiveFormsModule, Message],
    selector: 'error-box',
    templateUrl: './error-box.component.html',
})
export class ErrorBoxComponent {
    formControlElement = input<FormControl | null | undefined>();

    constructor() {
    }

    errorKeys(errors: any): string[] {
        return Object.keys(errors || {});
    }
}
