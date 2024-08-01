import { Component, inject, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IExponent } from 'app/entities/exponent/exponent.model';
import { ExponentService } from 'app/entities/exponent/service/exponent.service';
import { ISalon } from 'app/entities/salon/salon.model';
import { SalonService } from 'app/entities/salon/service/salon.service';
import { Status } from 'app/entities/enumerations/status.model';
import { ParticipationService } from '../service/participation.service';
import { IParticipation } from '../participation.model';
import { ParticipationFormService, ParticipationFormGroup } from './participation-form.service';

@Component({
  standalone: true,
  selector: 'jhi-participation-update',
  templateUrl: './participation-update.component.html',
  imports: [SharedModule, FormsModule, ReactiveFormsModule],
})
export class ParticipationUpdateComponent implements OnInit {
  isSaving = false;
  participation: IParticipation | null = null;
  statusValues = Object.keys(Status);

  exponentsSharedCollection: IExponent[] = [];
  salonsSharedCollection: ISalon[] = [];

  protected participationService = inject(ParticipationService);
  protected participationFormService = inject(ParticipationFormService);
  protected exponentService = inject(ExponentService);
  protected salonService = inject(SalonService);
  protected activatedRoute = inject(ActivatedRoute);

  // eslint-disable-next-line @typescript-eslint/member-ordering
  editForm: ParticipationFormGroup = this.participationFormService.createParticipationFormGroup();

  compareExponent = (o1: IExponent | null, o2: IExponent | null): boolean => this.exponentService.compareExponent(o1, o2);

  compareSalon = (o1: ISalon | null, o2: ISalon | null): boolean => this.salonService.compareSalon(o1, o2);

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ participation }) => {
      this.participation = participation;
      if (participation) {
        this.updateForm(participation);
      }

      this.loadRelationshipsOptions();
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const participation = this.participationFormService.getParticipation(this.editForm);
    if (participation.id !== null) {
      this.subscribeToSaveResponse(this.participationService.update(participation));
    } else {
      this.subscribeToSaveResponse(this.participationService.create(participation));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IParticipation>>): void {
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

  protected updateForm(participation: IParticipation): void {
    this.participation = participation;
    this.participationFormService.resetForm(this.editForm, participation);

    this.exponentsSharedCollection = this.exponentService.addExponentToCollectionIfMissing<IExponent>(
      this.exponentsSharedCollection,
      participation.exponent,
    );
    this.salonsSharedCollection = this.salonService.addSalonToCollectionIfMissing<ISalon>(this.salonsSharedCollection, participation.salon);
  }

  protected loadRelationshipsOptions(): void {
    this.exponentService
      .query()
      .pipe(map((res: HttpResponse<IExponent[]>) => res.body ?? []))
      .pipe(
        map((exponents: IExponent[]) =>
          this.exponentService.addExponentToCollectionIfMissing<IExponent>(exponents, this.participation?.exponent),
        ),
      )
      .subscribe((exponents: IExponent[]) => (this.exponentsSharedCollection = exponents));

    this.salonService
      .query()
      .pipe(map((res: HttpResponse<ISalon[]>) => res.body ?? []))
      .pipe(map((salons: ISalon[]) => this.salonService.addSalonToCollectionIfMissing<ISalon>(salons, this.participation?.salon)))
      .subscribe((salons: ISalon[]) => (this.salonsSharedCollection = salons));
  }
}
