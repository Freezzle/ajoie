import { AfterViewInit, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import SharedModule from 'app/shared/shared.module';

import { PasswordResetInitService } from './password-reset-init.service';
import { ErrorModel } from '../../../shared/field-error/error.model';
import { FieldErrorComponent } from '../../../shared/field-error/field-error.component';

@Component({
  standalone: true,
  selector: 'jhi-password-reset-init',
  imports: [SharedModule, FormsModule, ReactiveFormsModule, FieldErrorComponent],
  templateUrl: './password-reset-init.component.html',
})
export default class PasswordResetInitComponent implements AfterViewInit {
  email = viewChild.required<ElementRef>('email');

  success = signal(false);
  resetRequestForm;

  private passwordResetInitService = inject(PasswordResetInitService);
  private fb = inject(FormBuilder);

  constructor() {
    this.resetRequestForm = this.fb.group({
      email: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(254), Validators.email]],
    });
  }

  ngAfterViewInit(): void {
    this.email().nativeElement.focus();
  }

  requestReset(): void {
    this.passwordResetInitService.save(this.resetRequestForm.get(['email'])!.value).subscribe(() => this.success.set(true));
  }

  get getEmail(): FormControl {
    return this.resetRequestForm.get('email') as FormControl;
  }

  protected readonly ErrorModel = ErrorModel;
}
