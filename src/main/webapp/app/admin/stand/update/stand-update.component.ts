import { Component, inject, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IExponent } from 'app/entities/exponent/exponent.model';
import { ExponentService } from 'app/entities/exponent/service/exponent.service';
import { ISalon } from 'app/admin/salon/salon.model';
import { SalonService } from 'app/admin/salon/service/salon.service';
import { IDimensionStand } from 'app/entities/dimension-stand/dimension-stand.model';
import { DimensionStandService } from 'app/entities/dimension-stand/service/dimension-stand.service';
import { StandService } from '../service/stand.service';
import { IStand } from '../stand.model';
import { StandFormService, StandFormGroup } from './stand-form.service';
import FormatMediumDatePipe from '../../../shared/date/format-medium-date.pipe';
import { Status } from '../../../entities/enumerations/status.model';
import { IParticipation } from '../../../entities/participation/participation.model';
import { ParticipationService } from '../../../entities/participation/service/participation.service';

@Component({
  standalone: true,
  selector: 'jhi-stand-update',
  templateUrl: './stand-update.component.html',
  imports: [SharedModule, FormsModule, ReactiveFormsModule, FormatMediumDatePipe],
})
export class StandUpdateComponent implements OnInit {
  isSaving = false;
  stand: IStand | null = null;
  statusValues = Object.keys(Status);

  participationsSharedCollection: IParticipation[] = [];
  dimensionStandsSharedCollection: IDimensionStand[] = [];

  protected standService = inject(StandService);
  protected standFormService = inject(StandFormService);
  protected participationService = inject(ParticipationService);
  protected dimensionStandService = inject(DimensionStandService);
  protected activatedRoute = inject(ActivatedRoute);
  protected state: any;

  // eslint-disable-next-line @typescript-eslint/member-ordering
  editForm: StandFormGroup = this.standFormService.createStandFormGroup();

  compareParticipation = (o1: IParticipation | null, o2: IParticipation | null): boolean =>
    this.participationService.compareParticipation(o1, o2);

  compareDimensionStand = (o1: IDimensionStand | null, o2: IDimensionStand | null): boolean =>
    this.dimensionStandService.compareDimensionStand(o1, o2);

  ngOnInit(): void {
    this.state = window.history.state as { idSalon: string };

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

    this.participationsSharedCollection = this.participationService.addParticipationToCollectionIfMissing<IParticipation>(
      this.participationsSharedCollection,
      stand.participation,
    );
    this.dimensionStandsSharedCollection = this.dimensionStandService.addDimensionStandToCollectionIfMissing<IDimensionStand>(
      this.dimensionStandsSharedCollection,
      stand.dimension,
    );
  }

  protected loadRelationshipsOptions(): void {
    const queryObject: any = {
      idSalon: this.state.idSalon,
    };

    this.participationService
      .query(queryObject)
      .pipe(map((res: HttpResponse<IParticipation[]>) => res.body ?? []))
      .pipe(
        map((participations: IParticipation[]) =>
          this.participationService.addParticipationToCollectionIfMissing<IParticipation>(participations, this.stand?.participation),
        ),
      )
      .subscribe((participations: IParticipation[]) => (this.participationsSharedCollection = participations));

    this.dimensionStandService
      .query(queryObject)
      .pipe(map((res: HttpResponse<IDimensionStand[]>) => res.body ?? []))
      .pipe(
        map((dimensionStands: IDimensionStand[]) =>
          this.dimensionStandService.addDimensionStandToCollectionIfMissing<IDimensionStand>(dimensionStands, this.stand?.dimension),
        ),
      )
      .subscribe((dimensionStands: IDimensionStand[]) => (this.dimensionStandsSharedCollection = dimensionStands));
  }
}
