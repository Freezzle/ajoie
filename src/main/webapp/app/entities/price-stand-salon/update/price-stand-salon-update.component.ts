import { Component, inject, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IDimensionStand } from 'app/entities/dimension-stand/dimension-stand.model';
import { DimensionStandService } from 'app/entities/dimension-stand/service/dimension-stand.service';
import { ISalon } from 'app/entities/salon/salon.model';
import { SalonService } from 'app/entities/salon/service/salon.service';
import { PriceStandSalonService } from '../service/price-stand-salon.service';
import { IPriceStandSalon } from '../price-stand-salon.model';
import { PriceStandSalonFormService, PriceStandSalonFormGroup } from './price-stand-salon-form.service';

@Component({
  standalone: true,
  selector: 'jhi-price-stand-salon-update',
  templateUrl: './price-stand-salon-update.component.html',
  imports: [SharedModule, FormsModule, ReactiveFormsModule],
})
export class PriceStandSalonUpdateComponent implements OnInit {
  isSaving = false;
  priceStandSalon: IPriceStandSalon | null = null;

  dimensionStandsSharedCollection: IDimensionStand[] = [];
  salonsSharedCollection: ISalon[] = [];

  protected priceStandSalonService = inject(PriceStandSalonService);
  protected priceStandSalonFormService = inject(PriceStandSalonFormService);
  protected dimensionStandService = inject(DimensionStandService);
  protected salonService = inject(SalonService);
  protected activatedRoute = inject(ActivatedRoute);

  // eslint-disable-next-line @typescript-eslint/member-ordering
  editForm: PriceStandSalonFormGroup = this.priceStandSalonFormService.createPriceStandSalonFormGroup();

  compareDimensionStand = (o1: IDimensionStand | null, o2: IDimensionStand | null): boolean =>
    this.dimensionStandService.compareDimensionStand(o1, o2);

  compareSalon = (o1: ISalon | null, o2: ISalon | null): boolean => this.salonService.compareSalon(o1, o2);

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ priceStandSalon }) => {
      this.priceStandSalon = priceStandSalon;
      if (priceStandSalon) {
        this.updateForm(priceStandSalon);
      }

      this.loadRelationshipsOptions();
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const priceStandSalon = this.priceStandSalonFormService.getPriceStandSalon(this.editForm);
    if (priceStandSalon.id !== null) {
      this.subscribeToSaveResponse(this.priceStandSalonService.update(priceStandSalon));
    } else {
      this.subscribeToSaveResponse(this.priceStandSalonService.create(priceStandSalon));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IPriceStandSalon>>): void {
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

  protected updateForm(priceStandSalon: IPriceStandSalon): void {
    this.priceStandSalon = priceStandSalon;
    this.priceStandSalonFormService.resetForm(this.editForm, priceStandSalon);

    this.dimensionStandsSharedCollection = this.dimensionStandService.addDimensionStandToCollectionIfMissing<IDimensionStand>(
      this.dimensionStandsSharedCollection,
      priceStandSalon.dimension,
    );
    this.salonsSharedCollection = this.salonService.addSalonToCollectionIfMissing<ISalon>(
      this.salonsSharedCollection,
      priceStandSalon.salon,
    );
  }

  protected loadRelationshipsOptions(): void {
    this.dimensionStandService
      .query()
      .pipe(map((res: HttpResponse<IDimensionStand[]>) => res.body ?? []))
      .pipe(
        map((dimensionStands: IDimensionStand[]) =>
          this.dimensionStandService.addDimensionStandToCollectionIfMissing<IDimensionStand>(
            dimensionStands,
            this.priceStandSalon?.dimension,
          ),
        ),
      )
      .subscribe((dimensionStands: IDimensionStand[]) => (this.dimensionStandsSharedCollection = dimensionStands));

    this.salonService
      .query()
      .pipe(map((res: HttpResponse<ISalon[]>) => res.body ?? []))
      .pipe(map((salons: ISalon[]) => this.salonService.addSalonToCollectionIfMissing<ISalon>(salons, this.priceStandSalon?.salon)))
      .subscribe((salons: ISalon[]) => (this.salonsSharedCollection = salons));
  }
}
