import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import SharedModule from '../shared.module';

@Component({
  imports: [CommonModule, SharedModule, ReactiveFormsModule],
  selector: 'error-box',
  standalone: true,
  templateUrl: './error-box.component.html',
  styleUrl: './error-box.component.scss',
})
export class ErrorBoxComponent {
  formControlElement = input<FormControl | null | undefined>();

  constructor() {
  }

  errorKeys(errors: any): string[] {
    return Object.keys(errors || {});
  }
}
