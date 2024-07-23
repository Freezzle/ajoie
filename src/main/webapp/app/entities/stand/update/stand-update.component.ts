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
import { IDimensionStand } from 'app/entities/dimension-stand/dimension-stand.model';
import { DimensionStandService } from 'app/entities/dimension-stand/service/dimension-stand.service';
import { StandService } from '../service/stand.service';
import { IStand } from '../stand.model';
import { StandFormService, StandFormGroup } from './stand-form.service';

@Component({
  standalone: true,
  selector: 'jhi-stand-update',
  templateUrl: './stand-update.component.html',
  imports: [SharedModule, FormsModule, ReactiveFormsModule],
})
export class StandUpdateComponent implements OnInit {
  isSaving = false;
  stand: IStand | null = null;

  exponentsSharedCollection: IExponent[] = [];
  salonsSharedCollection: ISalon[] = [];
  dimensionStandsSharedCollection: IDimensionStand[] = [];

  protected standService = inject(StandService);
  protected standFormService = inject(StandFormService);
  protected exponentService = inject(ExponentService);
  protected salonService = inject(SalonService);
  protected dimensionStandService = inject(DimensionStandService);
  protected activatedRoute = inject(ActivatedRoute);

  // eslint-disable-next-line @typescript-eslint/member-ordering
  editForm: StandFormGroup = this.standFormService.createStandFormGroup();

  compareExponent = (o1: IExponent | null, o2: IExponent | null): boolean => this.exponentService.compareExponent(o1, o2);

  compareSalon = (o1: ISalon | null, o2: ISalon | null): boolean => this.salonService.compareSalon(o1, o2);

  compareDimensionStand = (o1: IDimensionStand | null, o2: IDimensionStand | null): boolean =>
    this.dimensionStandService.compareDimensionStand(o1, o2);

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ stand }) => {
      this.stand = stand;
      if (stand) {
        this.updateForm(stand);
      }

      this.loadRelationshipsOptions();
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const stand = this.standFormService.getStand(this.editForm);
    if (stand.id !== null) {
      this.subscribeToSaveResponse(this.standService.update(stand));
    } else {
      this.subscribeToSaveResponse(this.standService.create(stand));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IStand>>): void {
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

  protected updateForm(stand: IStand): void {
    this.stand = stand;
    this.standFormService.resetForm(this.editForm, stand);

    this.exponentsSharedCollection = this.exponentService.addExponentToCollectionIfMissing<IExponent>(
      this.exponentsSharedCollection,
      stand.exponent,
    );
    this.salonsSharedCollection = this.salonService.addSalonToCollectionIfMissing<ISalon>(this.salonsSharedCollection, stand.salon);
    this.dimensionStandsSharedCollection = this.dimensionStandService.addDimensionStandToCollectionIfMissing<IDimensionStand>(
      this.dimensionStandsSharedCollection,
      stand.dimension,
    );
  }

  protected loadRelationshipsOptions(): void {
    this.exponentService
      .query()
      .pipe(map((res: HttpResponse<IExponent[]>) => res.body ?? []))
      .pipe(
        map((exponents: IExponent[]) => this.exponentService.addExponentToCollectionIfMissing<IExponent>(exponents, this.stand?.exponent)),
      )
      .subscribe((exponents: IExponent[]) => (this.exponentsSharedCollection = exponents));

    this.salonService
      .query()
      .pipe(map((res: HttpResponse<ISalon[]>) => res.body ?? []))
      .pipe(map((salons: ISalon[]) => this.salonService.addSalonToCollectionIfMissing<ISalon>(salons, this.stand?.salon)))
      .subscribe((salons: ISalon[]) => (this.salonsSharedCollection = salons));

    this.dimensionStandService
      .query()
      .pipe(map((res: HttpResponse<IDimensionStand[]>) => res.body ?? []))
      .pipe(
        map((dimensionStands: IDimensionStand[]) =>
          this.dimensionStandService.addDimensionStandToCollectionIfMissing<IDimensionStand>(dimensionStands, this.stand?.dimension),
        ),
      )
      .subscribe((dimensionStands: IDimensionStand[]) => (this.dimensionStandsSharedCollection = dimensionStands));
  }
}
