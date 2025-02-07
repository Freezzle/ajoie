import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IPriceStandSalon, ISalon, sortPriceStandSalon } from '../salon.model';
import { SalonService } from '../service/salon.service';
import { SalonFormGroup, SalonFormService } from './salon-form.service';
import { DimensionStandService } from '../../dimension-stand/service/dimension-stand.service';
import { ErrorModel } from '../../../shared/field-error/error.model';
import { FieldErrorComponent } from '../../../shared/field-error/field-error.component';
import { State } from '../../enumerations/state.model';
import { Status } from '../../enumerations/status.model';
import ColorLockBooleanPipe from '../../../shared/pipe/color-lock-boolean.pipe';
import FormatMediumDatePipe from '../../../shared/date/format-medium-date.pipe';
import LockBooleanPipe from '../../../shared/pipe/lock-boolean.pipe';

@Component({
  standalone: true,
  selector: 'jhi-salon-update',
  templateUrl: './salon-update.component.html',
  imports: [
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    FieldErrorComponent,
    ColorLockBooleanPipe,
    FormatMediumDatePipe,
    LockBooleanPipe,
  ],
})
export class SalonUpdateComponent implements OnInit {
  protected salonService = inject(SalonService);
  protected salonFormService = inject(SalonFormService);
  protected dimensionStandService = inject(DimensionStandService);
  protected activatedRoute = inject(ActivatedRoute);

  isSaving = false;
  salon: ISalon | null = null;
  readonlyForm = false;
  editForm: FormGroup<SalonFormGroup> = this.salonFormService.createSalonFormGroup({ id: null });

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ salon, readonly }) => {
      this.salon = salon as ISalon;
      this.readonlyForm = readonly;

      this.dimensionStandService.query().subscribe((dimensions) => {
        if (!this.salon) {
          this.salon = {} as ISalon;
        }

        if (dimensions.body) {
          if (!this.salon.priceStandSalons) {
            this.salon.priceStandSalons = [];
          }

          dimensions.body.forEach((dimensionParam) => {
            if (
              !this.salon?.priceStandSalons
                ?.map((priceStand) => priceStand.dimension?.id)
                .includes(dimensionParam.id)
            ) {
              this.salon?.priceStandSalons?.push({
                price: null,
                dimension: dimensionParam,
              } as IPriceStandSalon);
            }
          });
        }

        sortPriceStandSalon(this.salon.priceStandSalons ?? []);

        this.editForm = this.salonFormService.createSalonFormGroup(this.salon);

        if (this.readonlyForm) {
          this.readOnlyBack();
        } else {
          this.writeBack();
        }
      });
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

    const salon = this.salonFormService.getSalon(this.editForm);
    if (salon.id !== null) {
      this.salonService
        .update(salon)
        .pipe(finalize(() => (this.isSaving = false)))
        .subscribe(() => {
          this.previousState();
        });
    } else {
      this.salonService
        .create(salon)
        .pipe(finalize(() => (this.isSaving = false)))
        .subscribe(() => {
          this.previousState();
        });
    }
  }

  get getPlace(): FormControl {
    return this.editForm.get('place') as FormControl;
  }

  get getReferenceNumber(): FormControl {
    return this.editForm.get('referenceNumber') as FormControl;
  }

  get getStartingDate(): FormControl {
    return this.editForm.get('startingDate') as FormControl;
  }

  get getEndingDate(): FormControl {
    return this.editForm.get('endingDate') as FormControl;
  }

  protected readonly ErrorModel = ErrorModel;
  protected readonly State = State;
  protected readonly Status = Status;
}
