import {Component, inject, OnInit} from '@angular/core';
import {HttpResponse} from '@angular/common/http';
import {ActivatedRoute} from '@angular/router';
import {of} from 'rxjs';
import {catchError, finalize, map} from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import {FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';

import {WorkshopService} from '../service/workshop.service';
import {IWorkshop} from '../model/workshop.interface';
import {WorkshopFormGroup, WorkshopFormService} from '../service/workshop-form.service';
import {IParticipation, selectFilterParticipation} from '../../participation/model/participation.interface';
import {formatterParticipation, ParticipationService} from '../../participation/service/participation.service';
import {formatterStatus, Status} from '../../enumerations/status.model';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {TextareaBoxComponent} from '../../../shared/components/textarea-box/textarea-box.component';
import {TextBoxComponent} from '../../../shared/components/text-box/text-box.component';
import {SelectBoxComponent} from '../../../shared/components/select-box/select-box.component';
import {LinkBoxComponent} from '../../../shared/components/link-box/link-box.component';
import {AlertErrorComponent} from '../../../shared/alert/alert-error.component';
import {AlertComponent} from '../../../shared/alert/alert.component';
import {ConfirmPopup} from 'primeng/confirmpopup';
import {Toast} from 'primeng/toast';
import {ContentPageComponent} from '../../../shared/components/content-page/content-page.component';
import {CardComponent} from '../../../shared/components/card/card.component';

@Component({
               selector: 'app-workshop-update',
               templateUrl: './workshop-update.component.html',
               imports: [SharedModule, FormsModule, ReactiveFormsModule, ButtonBoxComponent,
                         TextareaBoxComponent, TextBoxComponent, SelectBoxComponent, LinkBoxComponent, AlertErrorComponent, AlertComponent, ConfirmPopup, Toast, ContentPageComponent, CardComponent]
           })
export class WorkshopUpdateComponent implements OnInit {
    isLoading = false;
    isReadOnly = false;
    eventId!: string;
    initialWorkshop: IWorkshop | null = null;
    statusValues = Object.keys(Status);
    participationsOptions: IParticipation[] = [];
    protected workshopService = inject(WorkshopService);
    protected workshopFormService = inject(WorkshopFormService);
    editForm: FormGroup<WorkshopFormGroup> = this.workshopFormService.createWorkshopFormGroup(null);
    protected participationService = inject(ParticipationService);
    protected activatedRoute = inject(ActivatedRoute);
    protected readonly formatterParticipation = formatterParticipation;
    protected readonly formatterStatus = formatterStatus;
    protected readonly selectFilterParticipation = selectFilterParticipation;

    ngOnInit(): void {
        const data = this.activatedRoute.snapshot.data;

        this.eventId = this.activatedRoute.snapshot.paramMap.get('idSalon')!;
        const participationId = this.activatedRoute.snapshot.paramMap.get('idParticipation')!;
        this.initialWorkshop = {...data['workshop']};

        this.editForm = this.workshopFormService.createWorkshopFormGroup(this.initialWorkshop);
        if (data['readonly']) {
            this.isReadOnly = true;
            this.editForm.disable();
        } else {
            this.edit();
        }

        this.loadRelationshipsOptions(this.eventId, participationId);
    }

    edit(): void {
        this.isReadOnly = false;
        this.editForm.enable();
    }

    previousState(): void {
        window.history.back();
    }

    cancel(): void {
        this.isReadOnly = true;
        this.editForm = this.workshopFormService.createWorkshopFormGroup(this.initialWorkshop);
        this.editForm.disable();
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

    private loadRelationshipsOptions(eventId: string, participationId: string | null): void {
        this.participationService.query(eventId)
            .pipe(
                map((res: HttpResponse<IParticipation[]>) => res.body ?? []),
                map((participations) => {
                    if (participationId) {
                        this.editForm.get('participation')?.setValue(
                            participations.find(p => p.id === participationId) ?? null
                        );
                    }
                    return participations;
                }),
                catchError(() => of([])))
            .subscribe((participations) => (this.participationsOptions = participations));
    }
}
