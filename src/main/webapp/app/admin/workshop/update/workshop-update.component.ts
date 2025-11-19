import {Component, inject, OnInit} from '@angular/core';
import {HttpResponse} from '@angular/common/http';
import {ActivatedRoute, ParamMap} from '@angular/router';
import {combineLatest, of} from 'rxjs';
import {catchError, finalize, map} from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import {FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';

import {WorkshopService} from '../service/workshop.service';
import {IWorkshop} from '../model/workshop.interface';
import {WorkshopFormGroup, WorkshopFormService} from '../service/workshop-form.service';
import {
    getFormattedParticipationName,
    IParticipation,
    selectFilterParticipation
} from '../../participation/model/participation.interface';
import {formatterParticipation, ParticipationService} from '../../participation/service/participation.service';
import {compareStatus, formatterStatus, Status} from '../../enumerations/status.model';
import {ErrorModel} from '../../../shared/field-error/error.model';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {TextareaBoxComponent} from '../../../shared/components/textarea-box/textarea-box.component';
import {TextBoxComponent} from '../../../shared/components/text-box/text-box.component';
import {SelectBoxComponent} from '../../../shared/components/select-box/select-box.component';
import {LinkBoxComponent} from "../../../shared/components/link-box/link-box.component";
import {AlertErrorComponent} from "../../../shared/alert/alert-error.component";
import {AlertComponent} from "../../../shared/alert/alert.component";
import {selectFilterDimension} from "../../salon/model/price-stand-salon.interface";

@Component({
    selector: 'jhi-workshop-update',
    templateUrl: './workshop-update.component.html',
    imports: [SharedModule, FormsModule, ReactiveFormsModule, ButtonBoxComponent,
        TextareaBoxComponent, TextBoxComponent, SelectBoxComponent, LinkBoxComponent, AlertErrorComponent, AlertComponent]
})
export class WorkshopUpdateComponent implements OnInit {
    protected workshopService = inject(WorkshopService);
    protected workshopFormService = inject(WorkshopFormService);
    protected participationService = inject(ParticipationService);
    protected activatedRoute = inject(ActivatedRoute);

    isLoading = false;
    isReadOnly = false;

    initialWorkshop: IWorkshop | null = null;
    statusValues = Object.keys(Status);
    params!: ParamMap;
    participationsOptions: IParticipation[] = [];
    editForm: FormGroup<WorkshopFormGroup> = this.workshopFormService.createWorkshopFormGroup(null);

    ngOnInit(): void {
        this.activateReadOnlyMode(false);

        combineLatest([this.activatedRoute.paramMap, this.activatedRoute.data])
            .pipe(
                map(([params, data]) => ({
                    params,
                    isReadOnly: data['readonly'],
                    initialWorkshop: data['workshop'] as IWorkshop,
                })),
            )
            .subscribe(({params, isReadOnly, initialWorkshop}) => {
                this.params = params;
                this.isReadOnly = isReadOnly;
                this.initialWorkshop = {...initialWorkshop};

                this.editForm = this.workshopFormService.createWorkshopFormGroup(initialWorkshop);
                this.loadRelationshipsOptions(initialWorkshop);

                isReadOnly ? this.activateReadOnlyMode(false) : this.activateEditMode();
            });
    }

    activateReadOnlyMode(reset: boolean = true): void {
        this.isReadOnly = true;
        if (reset) {
            this.editForm = this.workshopFormService.createWorkshopFormGroup(this.initialWorkshop!);
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

    save(): void {
        if (this.editForm.invalid) {
            this.editForm.markAllAsTouched();
            return;
        }
        this.isLoading = true;

        const workshop = this.workshopFormService.getWorkshop(this.editForm);

        const saveOperation = workshop.id != null
            ? this.workshopService.update(workshop)
            : this.workshopService.create(workshop);

        saveOperation.pipe(finalize(() => (this.isLoading = false))).subscribe(() => this.previousState());
    }

    private loadRelationshipsOptions(workshop: IWorkshop): void {
        const idSalon = this.params.get('idSalon');
        const idParticipation = this.params.get('idParticipation');

        if (!idSalon) {
            return;
        }

        this.participationService.query(idSalon)
            .pipe(
                map((res: HttpResponse<IParticipation[]>) => res.body ?? []),
                map((participations) => {
                    if (idParticipation) {
                        this.editForm.get('participation')?.setValue(
                            participations.find(p => p.id === idParticipation) || null,
                        );
                    }
                    return this.participationService.addParticipationsOptionsIfMissing(participations, workshop?.participation);
                }),
                catchError(() => of([])),
            )
            .subscribe((participations) => (this.participationsOptions = participations));
    }

    protected readonly ErrorModel = ErrorModel;
    protected readonly getFormattedParticipationName = getFormattedParticipationName;
    protected readonly formatterParticipation = formatterParticipation;
    protected readonly formatterStatus = formatterStatus;
    protected readonly selectFilterDimension = selectFilterDimension;
    protected readonly selectFilterParticipation = selectFilterParticipation;
}
