import {AfterViewInit, Component, ElementRef, inject, OnInit, signal, viewChild} from '@angular/core';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, RouterModule} from '@angular/router';
import PasswordStrengthBarComponent from 'app/account/password/password-strength-bar/password-strength-bar.component';
import SharedModule from 'app/shared/shared.module';

import {PasswordResetFinishService} from './password-reset-finish.service';
import {ErrorModel} from '../../../shared/field-error/error.model';
import {FieldErrorComponent} from '../../../shared/field-error/field-error.component';

@Component({
    standalone: true,
    selector: 'jhi-password-reset-finish',
    imports: [SharedModule, RouterModule, FormsModule, ReactiveFormsModule, PasswordStrengthBarComponent,
              FieldErrorComponent],
    templateUrl: './password-reset-finish.component.html',
})
export default class PasswordResetFinishComponent implements OnInit, AfterViewInit {
    newPassword = viewChild.required<ElementRef>('newPassword');

    initialized = signal(false);
    doNotMatch = signal(false);
    error = signal(false);
    success = signal(false);
    key = signal('');

    passwordForm = new FormGroup({
        newPassword: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required, Validators.minLength(4), Validators.maxLength(50)],
        }),
        confirmPassword: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required, Validators.minLength(4), Validators.maxLength(50)],
        }),
    });

    private passwordResetFinishService = inject(PasswordResetFinishService);
    private route = inject(ActivatedRoute);

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            if (params['key']) {
                this.key.set(params['key']);
            }
            this.initialized.set(true);
        });
    }

    ngAfterViewInit(): void {
        this.newPassword().nativeElement.focus();
    }

    finishReset(): void {
        this.doNotMatch.set(false);
        this.error.set(false);

        const {newPassword, confirmPassword} = this.passwordForm.getRawValue();

        if (newPassword !== confirmPassword) {
            this.doNotMatch.set(true);
        } else {
            this.passwordResetFinishService.save(this.key(), newPassword).subscribe({
                next: () => this.success.set(true),
                error: () => this.error.set(true),
            });
        }
    }

    get getNewPassword(): FormControl {
        return this.passwordForm.get('newPassword') as FormControl;
    }

    get getConfirmPassword(): FormControl {
        return this.passwordForm.get('confirmPassword') as FormControl;
    }

    protected readonly ErrorModel = ErrorModel;
}
