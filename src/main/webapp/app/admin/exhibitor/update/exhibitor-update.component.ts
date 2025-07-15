import {Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {combineLatest, Observable, of} from 'rxjs';
import {finalize, map} from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import {FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ExhibitorService} from '../service/exhibitor.service';
import {ExhibitorFormGroup, ExhibitorFormService} from '../service/exhibitor-form.service';
import {ErrorModel} from '../../../shared/field-error/error.model';
import {formatterLanguage, LANGUAGES} from '../../../config/language.constants';
import ColorStatusPipe from '../../../shared/pipe/color-status.pipe';
import StatusPipe from '../../../shared/pipe/status.pipe';
import {IParticipation} from '../../participation/model/participation.interface';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {TextBoxComponent} from '../../../shared/components/text-box/text-box.component';
import {TextareaBoxComponent} from '../../../shared/components/textarea-box/textarea-box.component';
import {SelectBoxComponent} from '../../../shared/components/select-box/select-box.component';
import {IExhibitor} from '../model/exhibitor.interface';
import {CheckboxBoxComponent} from "../../../shared/components/checkbox-box/checkbox-box.component";
import {AlertErrorComponent} from "../../../shared/alert/alert-error.component";
import {AlertComponent} from "../../../shared/alert/alert.component";

@Component({
    selector: 'jhi-exhibitor-update',
    templateUrl: './exhibitor-update.component.html',
    imports: [
        SharedModule,
        FormsModule,
        ReactiveFormsModule,
        ColorStatusPipe,
        StatusPipe,
        RouterLink,
        ButtonBoxComponent,
        TextBoxComponent,
        TextareaBoxComponent,
        SelectBoxComponent,
        CheckboxBoxComponent,
        AlertErrorComponent,
        AlertComponent,
    ]
})
export class ExhibitorUpdateComponent implements OnInit {
    protected exhibitorService = inject(ExhibitorService);
    protected exhibitorFormService = inject(ExhibitorFormService);
    protected activatedRoute = inject(ActivatedRoute);

    isLoading = false;
    isReadOnly = false;

    initialExhibitor: IExhibitor | null = null;
    editForm: ExhibitorFormGroup = this.exhibitorFormService.createExhibitorFormGroup(null);

    languageValues = LANGUAGES;
    participations$: Observable<IParticipation[]> = of([]);

    ngOnInit(): void {
        this.activateReadOnlyMode();

        combineLatest([this.activatedRoute.data])
            .pipe(
                map(([data]) => ({
                    isReadOnly: data['readonly'],
                    initialExhibitor: data['exhibitor'] as IExhibitor,
                })),
            )
            .subscribe(({isReadOnly, initialExhibitor}) => {
                    this.isReadOnly = isReadOnly;
                    this.initialExhibitor = {...initialExhibitor};

                    this.editForm = this.exhibitorFormService.createExhibitorFormGroup(initialExhibitor);
                    this.loadRelationships(this.editForm.controls.id.value);

                    isReadOnly ? this.activateReadOnlyMode(false) : this.activateEditMode();
                },
            );
    }

    activateReadOnlyMode(reset: boolean = true): void {
        this.isReadOnly = true;
        if (reset) {
            this.editForm = this.exhibitorFormService.createExhibitorFormGroup(this.initialExhibitor!);
        }
        this.editForm.disable();
    }

    activateEditMode(): void {
        this.isReadOnly = false;
        this.editForm.enable();
    }

    previousState(): void {
        window.history.back();
    }

    loadRelationships(idExhibitor: string | null): void {
        if (!idExhibitor) {
            return;
        }
        this.participations$ = this.exhibitorService.findParticipations(idExhibitor);
    }

    save(): void {
        if (this.editForm.invalid) {
            this.editForm.markAllAsTouched();
            return;
        }
        this.isLoading = true;
        const exhibitor = this.exhibitorFormService.getExhibitor(this.editForm);

        const saveOperation = exhibitor.id != null
            ? this.exhibitorService.update(exhibitor)
            : this.exhibitorService.create(exhibitor);

        saveOperation.pipe(finalize(() => (this.isLoading = false))).subscribe(() => this.previousState());
    }

    protected readonly ErrorModel = ErrorModel;
    protected readonly formatterLanguage = formatterLanguage;
}
