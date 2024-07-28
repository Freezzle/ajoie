import {Component, inject, OnInit} from '@angular/core';
import {HttpResponse} from '@angular/common/http';
import {ActivatedRoute} from '@angular/router';
import {combineLatest, Observable} from 'rxjs';
import {finalize, map} from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';

import {ConferenceService} from '../service/conference.service';
import {IConference} from '../conference.model';
import {ConferenceFormGroup, ConferenceFormService} from './conference-form.service';
import {IParticipation} from '../../participation/participation.model';
import {ParticipationService} from '../../participation/service/participation.service';
import {Status} from '../../enumerations/status.model';
import {FieldErrorComponent} from "../../../shared/field-error/field-error.component";
import {ErrorModel} from "../../../shared/field-error/error.model";

@Component({
    standalone: true,
    selector: 'jhi-conference-update',
    templateUrl: './conference-update.component.html',
    imports: [SharedModule, FormsModule, ReactiveFormsModule, FieldErrorComponent],
})
export class ConferenceUpdateComponent implements OnInit {
    isSaving = false;
    conference: IConference | null = null;
    statusValues = Object.keys(Status);
    readonlyForm = false;
    params: any;

    participationsSharedCollection: IParticipation[] = [];

    protected conferenceService = inject(ConferenceService);
    protected conferenceFormService = inject(ConferenceFormService);
    // eslint-disable-next-line @typescript-eslint/member-ordering
    editForm: ConferenceFormGroup = this.conferenceFormService.createConferenceFormGroup();
    protected participationService = inject(ParticipationService);
    protected activatedRoute = inject(ActivatedRoute);

    compareParticipation = (o1: IParticipation | null, o2: IParticipation | null): boolean =>
        this.participationService.compareParticipation(o1, o2);

    ngOnInit(): void {
        combineLatest([this.activatedRoute.paramMap, this.activatedRoute.data]).subscribe(([params, data]) => {
            this.params = params;
            this.readonlyForm = data['readonly'];
            this.conference = data['conference'];

            if (this.conference) {
                this.updateForm(this.conference);

                if (this.readonlyForm) {
                    this.readOnlyBack();
                } else {
                    this.writeBack();
                }
            }
            this.loadRelationshipsOptions();
        });
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
        this.isSaving = true;
        const conference = this.conferenceFormService.getConference(this.editForm);
        if (conference.id !== null) {
            this.subscribeToSaveResponse(this.conferenceService.update(conference));
        } else {
            this.subscribeToSaveResponse(this.conferenceService.create(conference));
        }
    }

    protected subscribeToSaveResponse(result: Observable<HttpResponse<IConference>>): void {
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

    protected updateForm(conference: IConference): void {
        this.conference = conference;
        this.conferenceFormService.resetForm(this.editForm, conference);

        this.participationsSharedCollection = this.participationService.addParticipationToCollectionIfMissing<IParticipation>(
            this.participationsSharedCollection,
            conference.participation,
        );
    }


    get getTitle(): FormControl {
        return this.editForm.get('title') as FormControl;
    }

    get getParticipation(): FormControl {
        return this.editForm.get('participation') as FormControl;
    }

    get getStatus(): FormControl {
        return this.editForm.get('status') as FormControl;
    }

    protected loadRelationshipsOptions(): void {
        this.participationService
            .query(this.params.get('idSalon'))
            .pipe(map((res: HttpResponse<IParticipation[]>) => res.body ?? []))
            .pipe(
                map((participations: IParticipation[]) => {
                    if (this.params.get('idParticipation')) {
                        this.editForm
                            .get('participation')
                            ?.setValue(participations.find(
                                participation => participation.id === this.params.get('idParticipation')));
                    }

                    return this.participationService.addParticipationToCollectionIfMissing<IParticipation>(
                        participations,
                        this.conference?.participation,
                    );
                }),
            )
            .subscribe((participations: IParticipation[]) => (this.participationsSharedCollection = participations));
    }

    protected readonly ErrorModel = ErrorModel;
}
