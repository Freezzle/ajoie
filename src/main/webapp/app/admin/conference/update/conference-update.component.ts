import { Component, inject, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ConferenceService } from '../service/conference.service';
import { IConference } from '../model/conference.interface';
import { ConferenceFormGroup, ConferenceFormService } from '../service/conference-form.service';
import { getFormattedParticipationName, IParticipation } from '../../participation/model/participation.interface';
import { formatterParticipation, ParticipationService } from '../../participation/service/participation.service';
import { compareStatus, formatterStatus, Status } from '../../enumerations/status.model';
import { FieldErrorComponent } from '../../../shared/field-error/field-error.component';
import { ErrorModel } from '../../../shared/field-error/error.model';
import { ButtonBoxComponent } from '../../../shared/components/button-box/button-box.component';
import { TextareaBoxComponent } from '../../../shared/components/textarea-box/textarea-box.component';
import { TextBoxComponent } from '../../../shared/components/text-box/text-box.component';
import { SelectBoxComponent } from '../../../shared/components/select-box/select-box.component';
import { TypeaheadBoxComponent } from '../../../shared/components/typeahead-box/typeahead-box.component';

@Component({
  standalone: true,
  selector: 'jhi-conference-update',
  templateUrl: './conference-update.component.html',
  imports: [SharedModule, FormsModule, ReactiveFormsModule, FieldErrorComponent, ButtonBoxComponent,
            TextareaBoxComponent, TextBoxComponent, SelectBoxComponent, TypeaheadBoxComponent],
})
export class ConferenceUpdateComponent implements OnInit {
  protected conferenceService = inject(ConferenceService);
  protected conferenceFormService = inject(ConferenceFormService);
  protected participationService = inject(ParticipationService);
  protected activatedRoute = inject(ActivatedRoute);

  isLoading = false;
  isReadOnly = false;

  initialConference: IConference | null = null;
  statusValues = Object.keys(Status);
  params: any;
  participationsOptions: IParticipation[] = [];
  editForm: FormGroup<ConferenceFormGroup> = this.conferenceFormService.createConferenceFormGroup({
    id: null,
  });

  ngOnInit(): void {
    this.activateReadOnlyMode(false);

    combineLatest([this.activatedRoute.paramMap, this.activatedRoute.data])
      .pipe(
        map(([params, data]) => ({
          params,
          isReadOnly: data['readonly'],
          initialConference: data['conference'] as IConference,
        })),
      )
      .subscribe(({ params, isReadOnly, initialConference }) => {
        this.params = params;
        this.isReadOnly = isReadOnly;
        this.initialConference = { ...initialConference };

        this.editForm = this.conferenceFormService.createConferenceFormGroup(initialConference);
        this.loadRelationshipsOptions(initialConference);

        isReadOnly ? this.activateReadOnlyMode(false) : this.activateEditMode();
      });
  }

  activateReadOnlyMode(reset: boolean = true): void {
    this.isReadOnly = true;
    if (reset) {
      this.editForm = this.conferenceFormService.createConferenceFormGroup(this.initialConference!);
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

    const conference = this.conferenceFormService.getConference(this.editForm);

    const saveOperation = conference.id != null
                          ? this.conferenceService.update(conference)
                          : this.conferenceService.create(conference);

    saveOperation.pipe(finalize(() => (this.isLoading = false))).subscribe(() => this.previousState());
  }

  private loadRelationshipsOptions(conference: IConference): void {
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
          return this.participationService.addParticipationsOptionsIfMissing(participations, conference?.participation);
        }),
        catchError(() => of([])),
      )
      .subscribe((participations) => (this.participationsOptions = participations));
  }

  protected readonly ErrorModel = ErrorModel;
  protected readonly getFormattedParticipationName = getFormattedParticipationName;
  protected readonly formatterParticipation = formatterParticipation;
  protected readonly formatterStatus = formatterStatus;
  protected readonly compareStatus = compareStatus;
}
