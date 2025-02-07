import { Component, inject, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { combineLatest } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { StandService } from '../service/stand.service';
import { IStand } from '../stand.model';
import { StandFormGroup, StandFormService } from './stand-form.service';
import FormatMediumDatePipe from '../../../shared/date/format-medium-date.pipe';
import { IParticipation } from '../../participation/participation.model';
import { ParticipationService } from '../../participation/service/participation.service';
import { IDimensionStand, sortDimensionStand } from '../../dimension-stand/dimension-stand.model';
import { DimensionStandService } from '../../dimension-stand/service/dimension-stand.service';
import { Status } from '../../enumerations/status.model';
import { ErrorModel } from '../../../shared/field-error/error.model';
import { FieldErrorComponent } from '../../../shared/field-error/field-error.component';
import { Category } from '../../enumerations/category.model';
import { getExhibitorName, getFormattedExhibitorName } from '../../exhibitor/exhibitor.model';

@Component({
  standalone: true,
  selector: 'jhi-stand-update',
  templateUrl: './stand-update.component.html',
  imports: [
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    FormatMediumDatePipe,
    FieldErrorComponent,
  ],
})
export class StandUpdateComponent implements OnInit {
  protected standService = inject(StandService);
  protected standFormService = inject(StandFormService);
  protected participationService = inject(ParticipationService);
  protected dimensionStandService = inject(DimensionStandService);
  protected activatedRoute = inject(ActivatedRoute);

  isSaving = false;
  stand: IStand | null = null;
  statusValues = Object.keys(Status);
  categoryValues = Object.keys(Category);
  readonlyForm = false;
  params: any;
  participationsOptions: IParticipation[] = [];
  dimensionsOptions: IDimensionStand[] = [];
  editForm: FormGroup<StandFormGroup> = this.standFormService.createStandFormGroup({ id: null });

  compareParticipation = (o1: IParticipation | null, o2: IParticipation | null): boolean =>
    this.participationService.compareParticipation(o1, o2);

  compareDimensionStand = (o1: IDimensionStand | null, o2: IDimensionStand | null): boolean =>
    this.dimensionStandService.compareDimensionStand(o1, o2);

  ngOnInit(): void {
    combineLatest([this.activatedRoute.paramMap, this.activatedRoute.data]).subscribe(
      ([params, data]) => {
        this.stand = data['stand'];
        this.readonlyForm = data['readonly'];
        this.params = params;

        this.loadRelationshipsOptions();

        if (this.stand) {
          this.editForm = this.standFormService.createStandFormGroup(this.stand);

          if (this.readonlyForm) {
            this.readOnlyBack();
          } else {
            this.writeBack();
          }
        }
      },
    );
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
    const stand = this.standFormService.getStand(this.editForm);
    if (stand.id !== null) {
      this.standService
        .update(stand)
        .pipe(finalize(() => (this.isSaving = false)))
        .subscribe(() => {
          this.previousState();
        });
    } else {
      this.standService
        .create(stand)
        .pipe(finalize(() => (this.isSaving = false)))
        .subscribe(() => {
          this.previousState();
        });
    }
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
              ?.setValue(
                participations.find(
                  (participation) => participation.id === this.params.get('idParticipation'),
                ),
              );
          }

          return this.participationService.addParticipationsOptionsIfMissing<IParticipation>(
            participations,
            this.stand?.participation,
          );
        }),
      )
      .subscribe(
        (participations: IParticipation[]) => (this.participationsOptions = participations),
      );

    this.dimensionStandService
      .query()
      .pipe(map((res: HttpResponse<IDimensionStand[]>) => res.body ?? []))
      .pipe(
        map((dimensionStands: IDimensionStand[]) =>
          this.dimensionStandService.addDimensionsOptionsIfMissing<IDimensionStand>(
            dimensionStands,
            this.stand?.dimension,
          ),
        ),
      )
      .subscribe(
        (dimensionStands: IDimensionStand[]) =>
          (this.dimensionsOptions = sortDimensionStand(dimensionStands)),
      );
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

  get getDimension(): FormControl {
    return this.editForm.get('dimension') as FormControl;
  }

  get getTable(): FormControl {
    return this.editForm.get('nbTable') as FormControl;
  }

  get getChair(): FormControl {
    return this.editForm.get('nbChair') as FormControl;
  }

  get getPosition(): FormControl {
    return this.editForm.get('position') as FormControl;
  }

  protected readonly ErrorModel = ErrorModel;
  protected readonly getExhibitorName = getExhibitorName;
  protected readonly getFormattedExhibitorName = getFormattedExhibitorName;
}
