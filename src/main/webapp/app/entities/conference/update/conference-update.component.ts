import { Component, inject, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ISalon } from 'app/entities/salon/salon.model';
import { SalonService } from 'app/entities/salon/service/salon.service';
import { IExponent } from 'app/entities/exponent/exponent.model';
import { ExponentService } from 'app/entities/exponent/service/exponent.service';
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

  salonsSharedCollection: ISalon[] = [];
  exponentsSharedCollection: IExponent[] = [];

  protected conferenceService = inject(ConferenceService);
  protected conferenceFormService = inject(ConferenceFormService);
  protected salonService = inject(SalonService);
  protected exponentService = inject(ExponentService);
  protected activatedRoute = inject(ActivatedRoute);

  // eslint-disable-next-line @typescript-eslint/member-ordering
  editForm: ConferenceFormGroup = this.conferenceFormService.createConferenceFormGroup();

  compareSalon = (o1: ISalon | null, o2: ISalon | null): boolean => this.salonService.compareSalon(o1, o2);

  compareExponent = (o1: IExponent | null, o2: IExponent | null): boolean => this.exponentService.compareExponent(o1, o2);

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

    this.salonsSharedCollection = this.salonService.addSalonToCollectionIfMissing<ISalon>(this.salonsSharedCollection, conference.salon);
    this.exponentsSharedCollection = this.exponentService.addExponentToCollectionIfMissing<IExponent>(
      this.exponentsSharedCollection,
      conference.exponent,
    );
  }

  protected loadRelationshipsOptions(): void {
    this.salonService
      .query()
      .pipe(map((res: HttpResponse<ISalon[]>) => res.body ?? []))
      .pipe(map((salons: ISalon[]) => this.salonService.addSalonToCollectionIfMissing<ISalon>(salons, this.conference?.salon)))
      .subscribe((salons: ISalon[]) => (this.salonsSharedCollection = salons));

    this.exponentService
      .query()
      .pipe(map((res: HttpResponse<IExponent[]>) => res.body ?? []))
      .pipe(
        map((exponents: IExponent[]) =>
          this.exponentService.addExponentToCollectionIfMissing<IExponent>(exponents, this.conference?.exponent),
        ),
      )
      .subscribe((exponents: IExponent[]) => (this.exponentsSharedCollection = exponents));
  }
}
