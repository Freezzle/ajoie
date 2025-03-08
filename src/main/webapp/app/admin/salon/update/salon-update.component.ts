import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, finalize, switchMap } from 'rxjs/operators';

import { combineLatest, of } from 'rxjs';

import SharedModule from 'app/shared/shared.module';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ISalon } from '../model/salon.interface';
import { SalonService } from '../service/salon.service';
import { SalonFormGroup, SalonFormService } from '../service/salon-form.service';
import { DimensionStandService } from '../../dimension-stand/service/dimension-stand.service';
import { ErrorModel } from '../../../shared/field-error/error.model';
import { FieldErrorComponent } from '../../../shared/field-error/field-error.component';
import { State } from '../../enumerations/state.model';
import { Status } from '../../enumerations/status.model';
import ColorLockBooleanPipe from '../../../shared/pipe/color-lock-boolean.pipe';
import FormatMediumDatePipe from '../../../shared/date/format-medium-date.pipe';
import LockBooleanPipe from '../../../shared/pipe/lock-boolean.pipe';
import { ButtonBoxComponent } from '../../../shared/components/button-box/button-box.component';
import { TextBoxComponent } from '../../../shared/components/text-box/text-box.component';
import { TextareaBoxComponent } from '../../../shared/components/textarea-box/textarea-box.component';
import { DateBoxComponent } from '../../../shared/components/date-box/date-box.component';
import { LinkBoxComponent } from '../../../shared/components/link-box/link-box.component';
import { NumberBoxComponent } from '../../../shared/components/number-box/number-box.component';
import { IPriceStandSalon, sortPriceStandSalon } from '../model/price-stand-salon.interface';

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
    ButtonBoxComponent,
    TextBoxComponent,
    TextareaBoxComponent,
    DateBoxComponent,
    LinkBoxComponent,
    NumberBoxComponent,
  ],
})
export class SalonUpdateComponent implements OnInit {
  protected salonService = inject(SalonService);
  protected salonFormService = inject(SalonFormService);
  protected dimensionStandService = inject(DimensionStandService);
  protected activatedRoute = inject(ActivatedRoute);

  isLoading = false;
  initialSalon: ISalon | null = null;
  isReadOnly = true;
  editForm: FormGroup<SalonFormGroup> = this.salonFormService.createSalonFormGroup({ id: null });

  ngOnInit(): void {
    this.activateReadOnlyMode(false);

    combineLatest([this.activatedRoute.data])
      .pipe(
        switchMap(([data]) => {
          this.initialSalon = data['salon'] as ISalon;
          this.isReadOnly = data['readonly'];

          return this.dimensionStandService.query().pipe(
            catchError(() => of([])),
          );
        }),
      )
      .subscribe((dimensions) => {
        this.processSalonData(dimensions ?? []);

        this.editForm = this.salonFormService.createSalonFormGroup(this.initialSalon!);

        this.isReadOnly ? this.activateReadOnlyMode() : this.activateEditMode();
      });
  }

  private processSalonData(dimensions: any[]): void {
    if (!this.initialSalon) {
      this.initialSalon = {} as ISalon;
      this.initialSalon.priceStandSalons = [];
    }

    const existingIds = new Set(this.initialSalon.priceStandSalons?.map(ps => ps.dimension?.id) ?? []);

    this.initialSalon.priceStandSalons = [
      ...(this.initialSalon.priceStandSalons ?? []),
      ...dimensions.filter(dim => !existingIds.has(dim.id))
        .map(dim => ({ price: null, dimension: dim } as IPriceStandSalon)),
    ];

    sortPriceStandSalon(this.initialSalon.priceStandSalons);
  }

  activateReadOnlyMode(reset: boolean = true): void {
    this.isReadOnly = true;
    if (reset) {
      this.editForm = this.salonFormService.createSalonFormGroup(this.initialSalon!);
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

    const salon = this.salonFormService.getSalon(this.editForm);

    const saveOperation = salon.id != null
                          ? this.salonService.update(salon)
                          : this.salonService.create(salon);

    saveOperation.pipe(finalize(() => (this.isLoading = false))).subscribe(() => this.previousState());
  }

  protected readonly ErrorModel = ErrorModel;
  protected readonly State = State;
  protected readonly Status = Status;
}
