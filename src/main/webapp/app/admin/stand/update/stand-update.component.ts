import {Component, inject, OnInit} from '@angular/core';
import {HttpResponse} from '@angular/common/http';
import {ActivatedRoute} from '@angular/router';
import {combineLatest, Observable} from 'rxjs';
import {finalize, map} from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {StandService} from '../service/stand.service';
import {IStand} from '../stand.model';
import {StandFormGroup, StandFormService} from './stand-form.service';
import FormatMediumDatePipe from '../../../shared/date/format-medium-date.pipe';
import {IParticipation} from '../../participation/participation.model';
import {ParticipationService} from '../../participation/service/participation.service';
import {IDimensionStand} from '../../dimension-stand/dimension-stand.model';
import {DimensionStandService} from '../../dimension-stand/service/dimension-stand.service';
import {Status} from '../../enumerations/status.model';

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
    readonlyForm = false;
    params: any;

    participationsSharedCollection: IParticipation[] = [];
    dimensionStandsSharedCollection: IDimensionStand[] = [];

    protected standService = inject(StandService);
    protected standFormService = inject(StandFormService);
    // eslint-disable-next-line @typescript-eslint/member-ordering
    editForm: StandFormGroup = this.standFormService.createStandFormGroup();
    protected participationService = inject(ParticipationService);
    protected dimensionStandService = inject(DimensionStandService);
    protected activatedRoute = inject(ActivatedRoute);

    compareParticipation = (o1: IParticipation | null, o2: IParticipation | null): boolean =>
        this.participationService.compareParticipation(o1, o2);

    compareDimensionStand = (o1: IDimensionStand | null, o2: IDimensionStand | null): boolean =>
        this.dimensionStandService.compareDimensionStand(o1, o2);

    ngOnInit(): void {
        combineLatest([this.activatedRoute.paramMap, this.activatedRoute.data]).subscribe(([params, data]) => {
            this.stand = data['stand'];
            this.readonlyForm = data['readonly'];
            this.params = params;

            if (this.stand) {
                this.updateForm(this.stand);
                if (this.readonlyForm) {
                    this.readOnlyBack();
                } else {
                    this.writeBack();
                }
            }

            this.loadRelationshipsOptions();
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
        this.participationService
            .query(this.params.get('idSalon'))
            .pipe(map((res: HttpResponse<IParticipation[]>) => res.body ?? []))
            .pipe(
                map((participations: IParticipation[]) => {
                    if (this.params.get('idParticipation')) {
                        this.editForm
                            .get('participation')
                            ?.setValue(participations.find(
                                participation => participation.id === this.params.get('idParticipation')));
                    }

                    return this.participationService.addParticipationToCollectionIfMissing<IParticipation>(
                        participations, this.stand?.participation);
                }),
            )
            .subscribe((participations: IParticipation[]) => (this.participationsSharedCollection = participations));

        this.dimensionStandService
            .query()
            .pipe(map((res: HttpResponse<IDimensionStand[]>) => res.body ?? []))
            .pipe(
                map((dimensionStands: IDimensionStand[]) =>
                    this.dimensionStandService.addDimensionStandToCollectionIfMissing<IDimensionStand>(dimensionStands,
                        this.stand?.dimension),
                ),
            )
            .subscribe(
                (dimensionStands: IDimensionStand[]) => (this.dimensionStandsSharedCollection = dimensionStands));
    }
}
