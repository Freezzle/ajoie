import {Component, inject, OnInit, signal} from '@angular/core';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import {LANGUAGES} from 'app/config/language.constants';
import {IUser} from '../user-management.model';
import {UserManagementService} from '../service/user-management.service';
import {ErrorModel} from '../../../shared/field-error/error.model';
import {FieldErrorComponent} from '../../../shared/field-error/field-error.component';

const userTemplate = {} as IUser;

const newUser: IUser = {
    langKey: 'fr',
    activated: true,
} as IUser;

@Component({
    standalone: true,
    selector: 'jhi-user-mgmt-update',
    templateUrl: './user-management-update.component.html',
    imports: [SharedModule, FormsModule, ReactiveFormsModule, FieldErrorComponent],
})
export default class UserManagementUpdateComponent implements OnInit {
    languages = LANGUAGES;
    user: IUser | null = null;
    authorities = signal<string[]>([]);
    isSaving = signal(false);
    readonlyForm = false;

    editForm = new FormGroup({
        id: new FormControl(userTemplate.id),
        login: new FormControl(userTemplate.login, {
            nonNullable: true,
            validators: [
                Validators.required,
                Validators.minLength(1),
                Validators.maxLength(50),
                Validators.pattern(
                    '^[a-zA-Z0-9!$&*+=?^_`{|}~.-]+@[a-zA-Z0-9-]+(?:\\.[a-zA-Z0-9-]+)*$|^[_.@A-Za-z0-9-]+$'),
            ],
        }),
        firstName: new FormControl(userTemplate.firstName, {validators: [Validators.maxLength(50)]}),
        lastName: new FormControl(userTemplate.lastName, {validators: [Validators.maxLength(50)]}),
        email: new FormControl(userTemplate.email, {
            nonNullable: true,
            validators: [Validators.minLength(5), Validators.maxLength(254), Validators.email],
        }),
        activated: new FormControl(userTemplate.activated, {nonNullable: true}),
        langKey: new FormControl(userTemplate.langKey, {nonNullable: true}),
        authorities: new FormControl(userTemplate.authorities, {nonNullable: true}),
    });

    private userService = inject(UserManagementService);
    private activatedRoute = inject(ActivatedRoute);

    ngOnInit(): void {
        this.activatedRoute.data.subscribe(({user, readonly}) => {
            if (user) {
                this.editForm.reset(user);
            } else {
                this.editForm.reset(newUser);
            }

            this.user = user;

            if (readonly) {
                this.readOnlyBack();
            } else {
                this.writeBack();
            }
        });

        this.userService.authorities().subscribe(authorities => this.authorities.set(authorities));
    }

    readOnlyBack(): void {
        this.readonlyForm = true;
        this.editForm.disable();
    }

    writeBack(): void {
        this.readonlyForm = false;
        this.editForm.enable();
    }

    previousState(): void {
        window.history.back();
    }

    save(): void {
        this.isSaving.set(true);
        const user = this.editForm.getRawValue();
        if (user.id !== null) {
            this.userService.update(user).subscribe({
                next: () => this.onSaveSuccess(),
                error: () => this.onSaveError(),
            });
        } else {
            this.userService.create(user).subscribe({
                next: () => this.onSaveSuccess(),
                error: () => this.onSaveError(),
            });
        }
    }

    private onSaveSuccess(): void {
        this.isSaving.set(false);
        this.previousState();
    }

    private onSaveError(): void {
        this.isSaving.set(false);
    }

    get getLogin(): FormControl {
        return this.editForm.get('login') as FormControl;
    }

    get getLastName(): FormControl {
        return this.editForm.get('lastName') as FormControl;
    }

    get getFirstName(): FormControl {
        return this.editForm.get('firstName') as FormControl;
    }

    get getEmail(): FormControl {
        return this.editForm.get('email') as FormControl;
    }

    protected readonly ErrorModel = ErrorModel;
}
