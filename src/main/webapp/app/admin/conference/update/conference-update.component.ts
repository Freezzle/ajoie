import { Component, inject, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { combineLatest } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ConferenceService } from '../service/conference.service';
import { IConference } from '../conference.model';
import { ConferenceFormGroup, ConferenceFormService } from './conference-form.service';
import { IParticipation } from '../../participation/participation.model';
import { ParticipationService } from '../../participation/service/participation.service';
import { Status } from '../../enumerations/status.model';
import { FieldErrorComponent } from '../../../shared/field-error/field-error.component';
import { ErrorModel } from '../../../shared/field-error/error.model';

@Component({
  standalone: true,
  selector: 'jhi-conference-update',
  templateUrl: './conference-update.component.html',
  imports: [SharedModule, FormsModule, ReactiveFormsModule, FieldErrorComponent],
})
export class ConferenceUpdateComponent implements OnInit {
  protected conferenceService = inject(ConferenceService);
  protected conferenceFormService = inject(ConferenceFormService);
  protected participationService = inject(ParticipationService);
  protected activatedRoute = inject(ActivatedRoute);

  isSaving = false;
  conference: IConference | null = null;
  statusValues = Object.keys(Status);
  readonlyForm = false;
  params: any;
  participationsOptions: IParticipation[] = [];
  editForm: FormGroup<ConferenceFormGroup> = this.conferenceFormService.createConferenceFormGroup({ id: null });

  compareParticipation = (o1: IParticipation | null, o2: IParticipation | null): boolean =>
    this.participationService.compareParticipation(o1, o2);

  ngOnInit(): void {
    combineLatest([this.activatedRoute.paramMap, this.activatedRoute.data]).subscribe(([params, data]) => {
      this.params = params;
      this.readonlyForm = data['readonly'];
      this.conference = data['conference'];

      this.loadRelationshipsOptions();

      if (this.conference) {
        this.editForm = this.conferenceFormService.createConferenceFormGroup(this.conference);

        if (this.readonlyForm) {
          this.readOnlyBack();
        } else {
          this.writeBack();
        }
      }
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
      this.conferenceService
        .update(conference)
        .pipe(finalize(() => (this.isSaving = false)))
        .subscribe(() => {
          this.previousState();
        });
    } else {
      this.conferenceService
        .create(conference)
        .pipe(finalize(() => (this.isSaving = false)))
        .subscribe(() => {
          this.previousState();
        });
    }
  }

  get getTitle(): FormControl {
    return this.editForm.get('title') as FormControl;
  }

  get getDescription(): FormControl {
    return this.editForm.get('description') as FormControl;
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
              ?.setValue(participations.find(participation => participation.id === this.params.get('idParticipation')));
          }

          return this.participationService.addParticipationsOptionsIfMissing<IParticipation>(
            participations,
            this.conference?.participation,
          );
        }),
      )
      .subscribe((participations: IParticipation[]) => (this.participationsOptions = participations));
  }

  protected readonly ErrorModel = ErrorModel;
}
