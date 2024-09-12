import {Component, inject, OnInit} from '@angular/core';
import {HttpResponse} from '@angular/common/http';
import {ActivatedRoute} from '@angular/router';
import {Observable} from 'rxjs';
import {finalize} from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';

import {IAuthority} from '../authority.model';
import {AuthorityService} from '../service/authority.service';
import {AuthorityFormGroup, AuthorityFormService} from './authority-form.service';
import {ErrorModel} from '../../../shared/field-error/error.model';
import {FieldErrorComponent} from '../../../shared/field-error/field-error.component';

@Component({
    standalone: true,
    selector: 'jhi-authority-update',
    templateUrl: './authority-update.component.html',
    imports: [SharedModule, FormsModule, ReactiveFormsModule, FieldErrorComponent],
})
export class AuthorityUpdateComponent implements OnInit {
    isSaving = false;
    authority: IAuthority | null = null;
    readonlyForm = false;

    protected authorityService = inject(AuthorityService);
    protected authorityFormService = inject(AuthorityFormService);
    // eslint-disable-next-line @typescript-eslint/member-ordering
    editForm: AuthorityFormGroup = this.authorityFormService.createAuthorityFormGroup();
    protected activatedRoute = inject(ActivatedRoute);

    ngOnInit(): void {
        this.activatedRoute.data.subscribe(({authority, readonly}) => {
            this.readonlyForm = readonly;

            this.updateForm(authority);
            if (this.readonlyForm) {
                this.readOnlyBack();
            } else {
                this.writeBack();
            }
        });
    }

    previousState(): void {
        window.history.back();
    }

    save(): void {
        this.isSaving = true;
        const authority = this.authorityFormService.getAuthority(this.editForm);
        this.subscribeToSaveResponse(this.authorityService.create(authority));
    }

    readOnlyBack(): void {
        this.readonlyForm = true;
        this.editForm.disable();
    }

    writeBack(): void {
        this.readonlyForm = false;
        this.editForm.enable();
    }

    protected subscribeToSaveResponse(result: Observable<HttpResponse<IAuthority>>): void {
        result.pipe(finalize(() => this.onSaveFinalize())).subscribe({
            next: () => this.onSaveSuccess(),
            error: () => this.onSaveError(),
        });
    }

    protected onSaveSuccess(): void {
        this.previousState();
    }

    protected onSaveError(): void {
        // Api for inheritance.
    }

    protected onSaveFinalize(): void {
        this.isSaving = false;
    }

    protected updateForm(authority: IAuthority): void {
        this.authority = authority;
        this.authorityFormService.resetForm(this.editForm, authority);
    }

    get getName(): FormControl {
        return this.editForm.get('name') as FormControl;
    }

    protected readonly ErrorModel = ErrorModel;
}
