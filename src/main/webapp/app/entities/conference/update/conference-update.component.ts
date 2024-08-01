import { Component, inject, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IParticipation } from 'app/entities/participation/participation.model';
import { ParticipationService } from 'app/entities/participation/service/participation.service';
import { Status } from 'app/entities/enumerations/status.model';
import { ConferenceService } from '../service/conference.service';
import { IConference } from '../conference.model';
import { ConferenceFormService, ConferenceFormGroup } from './conference-form.service';

@Component({
  standalone: true,
  selector: 'jhi-conference-update',
  templateUrl: './conference-update.component.html',
  imports: [SharedModule, FormsModule, ReactiveFormsModule],
})
export class ConferenceUpdateComponent implements OnInit {
  isSaving = false;
  conference: IConference | null = null;
  statusValues = Object.keys(Status);

  participationsSharedCollection: IParticipation[] = [];

  protected conferenceService = inject(ConferenceService);
  protected conferenceFormService = inject(ConferenceFormService);
  protected participationService = inject(ParticipationService);
  protected activatedRoute = inject(ActivatedRoute);

  // eslint-disable-next-line @typescript-eslint/member-ordering
  editForm: ConferenceFormGroup = this.conferenceFormService.createConferenceFormGroup();

  compareParticipation = (o1: IParticipation | null, o2: IParticipation | null): boolean =>
    this.participationService.compareParticipation(o1, o2);

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ conference }) => {
      this.conference = conference;
      if (conference) {
        this.updateForm(conference);
      }

      this.loadRelationshipsOptions();
    });
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

  protected loadRelationshipsOptions(): void {
    this.participationService
      .query()
      .pipe(map((res: HttpResponse<IParticipation[]>) => res.body ?? []))
      .pipe(
        map((participations: IParticipation[]) =>
          this.participationService.addParticipationToCollectionIfMissing<IParticipation>(participations, this.conference?.participation),
        ),
      )
      .subscribe((participations: IParticipation[]) => (this.participationsSharedCollection = participations));
  }
}
