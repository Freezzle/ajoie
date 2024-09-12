import {Component, inject, OnInit, signal} from '@angular/core';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';

import SharedModule from 'app/shared/shared.module';
import {AccountService} from 'app/core/auth/account.service';
import {Account} from 'app/core/auth/account.model';
import {LANGUAGES} from 'app/config/language.constants';
import {FieldErrorComponent} from '../../shared/field-error/field-error.component';
import {ErrorModel} from '../../shared/field-error/error.model';

const initialAccount: Account = {} as Account;

@Component({
    standalone: true,
    selector: 'jhi-settings',
    imports: [SharedModule, FormsModule, ReactiveFormsModule, FieldErrorComponent],
    templateUrl: './settings.component.html',
})
export default class SettingsComponent implements OnInit {
    success = signal(false);
    languages = LANGUAGES;

    settingsForm = new FormGroup({
        firstName: new FormControl(initialAccount.firstName, {
            nonNullable: true,
            validators: [Validators.required, Validators.minLength(1), Validators.maxLength(50)],
        }),
        lastName: new FormControl(initialAccount.lastName, {
            nonNullable: true,
            validators: [Validators.required, Validators.minLength(1), Validators.maxLength(50)],
        }),
        email: new FormControl(initialAccount.email, {
            nonNullable: true,
            validators: [Validators.required, Validators.minLength(5), Validators.maxLength(254), Validators.email],
        }),
        langKey: new FormControl(initialAccount.langKey, {nonNullable: true}),

        activated: new FormControl(initialAccount.activated, {nonNullable: true}),
        authorities: new FormControl(initialAccount.authorities, {nonNullable: true}),
        imageUrl: new FormControl(initialAccount.imageUrl, {nonNullable: true}),
        login: new FormControl(initialAccount.login, {nonNullable: true}),
    });

    private accountService = inject(AccountService);
    private translateService = inject(TranslateService);

    ngOnInit(): void {
        this.accountService.identity().subscribe(account => {
            if (account) {
                this.settingsForm.patchValue(account);
            }
        });
    }

    save(): void {
        this.success.set(false);

        const account = this.settingsForm.getRawValue();
        this.accountService.save(account).subscribe(() => {
            this.success.set(true);

            this.accountService.authenticate(account);

            if (account.langKey !== this.translateService.currentLang) {
                this.translateService.use(account.langKey);
            }
        });
    }

    get getFirstName(): FormControl {
        return this.settingsForm.get('firstName') as FormControl;
    }

    get getLastName(): FormControl {
        return this.settingsForm.get('lastName') as FormControl;
    }

    get getEmail(): FormControl {
        return this.settingsForm.get('email') as FormControl;
    }

    protected readonly ErrorModel = ErrorModel;
}
