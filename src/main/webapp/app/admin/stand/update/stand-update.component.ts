import {Component, inject, OnInit} from '@angular/core';
import {HttpResponse} from '@angular/common/http';
import {ActivatedRoute} from '@angular/router';
import {forkJoin, of} from 'rxjs';
import {catchError, finalize, map} from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import {FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';

import {StandService} from '../service/stand.service';
import {IStand} from '../model/stand.interface';
import {StandFormGroup, StandFormService} from '../service/stand-form.service';
import {IParticipation, selectFilterParticipation} from '../../participation/model/participation.interface';
import {formatterParticipation, ParticipationService} from '../../participation/service/participation.service';
import {formatterStatus, Status} from '../../enumerations/status.model';
import {Category, formatterCategory} from '../../enumerations/category.model';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {TextareaBoxComponent} from '../../../shared/components/textarea-box/textarea-box.component';
import {TextBoxComponent} from '../../../shared/components/text-box/text-box.component';
import {NumberBoxComponent} from '../../../shared/components/number-box/number-box.component';
import {SelectBoxComponent} from '../../../shared/components/select-box/select-box.component';
import {CheckboxBoxComponent} from '../../../shared/components/checkbox-box/checkbox-box.component';
import {LinkBoxComponent} from "../../../shared/components/link-box/link-box.component";
import {SalonService} from "../../salon/service/salon.service";
import {
    formatterDimensionStand,
    IPriceStandSalon,
    selectFilterDimension,
    sortPriceStandSalon
} from "../../salon/model/price-stand-salon.interface";
import {AlertComponent} from "../../../shared/alert/alert.component";
import {AlertErrorComponent} from "../../../shared/alert/alert-error.component";
import {ConfirmPopup} from "primeng/confirmpopup";
import {Toast} from "primeng/toast";
import {ChipsBoxComponent} from "../../../shared/components/chips-box/chips-box.component";
import {CardComponent} from "../../../shared/components/card/card.component";
import {ContentPageComponent} from "../../../shared/components/content-page/content-page.component";

@Component({
    selector: 'app-stand-update',
    templateUrl: './stand-update.component.html',
    imports: [
        SharedModule,
        FormsModule,
        ReactiveFormsModule,
        ButtonBoxComponent,
        TextareaBoxComponent,
        TextBoxComponent,
        NumberBoxComponent,
        SelectBoxComponent,
        CheckboxBoxComponent,
        LinkBoxComponent,
        AlertComponent,
        AlertErrorComponent,
        ConfirmPopup,
        Toast,
        ChipsBoxComponent,
        CardComponent,
        ContentPageComponent,
    ]
})
export class StandUpdateComponent implements OnInit {
    protected salonService = inject(SalonService);
    protected standService = inject(StandService);
    protected standFormService = inject(StandFormService);
    protected participationService = inject(ParticipationService);
    protected activatedRoute = inject(ActivatedRoute);

    isLoading = false;
    isReadOnly = false;
    eventId!: string;

    initialStand: IStand | null = null;
    statusValues = Object.keys(Status);
    categoryValues = Object.keys(Category);
    participationsOptions: IParticipation[] = [];
    dimensionsOptions: IPriceStandSalon[] = [];
    editForm: FormGroup<StandFormGroup> = this.standFormService.createStandFormGroup(null);

    ngOnInit(): void {
        const data = this.activatedRoute.snapshot.data;

        this.eventId = this.activatedRoute.snapshot.paramMap.get('idSalon')!;
        const participationId = this.activatedRoute.snapshot.paramMap.get('idParticipation')!;
        this.initialStand = {...data['stand']};
        this.editForm = this.standFormService.createStandFormGroup(this.initialStand);

        if (data['readonly']) {
            this.isReadOnly = true;
            this.editForm.disable();
        } else {
            this.edit();
        }

        this.loadRelationshipsOptions(this.eventId, participationId);
    }

    edit(): void {
        this.isReadOnly = false;
        this.editForm.enable();
    }

    previousState(): void {
        window.history.back();
    }

    cancel(): void {
        this.isReadOnly = true;
        this.editForm = this.standFormService.createStandFormGroup(this.initialStand);
        this.editForm.disable();
    }

    save(): void {
        if (this.editForm.invalid) {
            this.editForm.markAllAsTouched();
            return;
        }

        this.isLoading = true;

        const stand = this.standFormService.getStand(this.editForm);
        const saveOperation = stand.id != null
            ? this.standService.update(stand)
            : this.standService.create(stand);

        saveOperation.pipe(finalize(() => (this.isLoading = false))).subscribe(() => this.previousState());
    }

    protected loadRelationshipsOptions(eventId: string, participationId: string | null): void {
        const participations$ =
            this.participationService
                .query(eventId)
                .pipe(
                    map((res: HttpResponse<IParticipation[]>) => res.body ?? []),
                    map((participations) => {
                        if (participationId) {
                            this.editForm.get('participation')?.setValue(
                                participations.find((p) => p.id === participationId) ?? null,
                            );
                        }
                        return participations;
                    }),
                    catchError(() => of([])));

        const dimensions$ =
            this.salonService
                .getDimensionStands(eventId)
                .pipe(
                    map((dimensionStands) => sortPriceStandSalon(dimensionStands)),
                    catchError(() => of([])));

        forkJoin({participations: participations$, dimensions: dimensions$})
            .subscribe(({participations, dimensions}) => {
                this.participationsOptions = participations;
                this.dimensionsOptions = dimensions;
            });
    }

    protected readonly formatterParticipation = formatterParticipation;
    protected readonly formatterDimensionStand = formatterDimensionStand;
    protected readonly formatterStatus = formatterStatus;
    protected readonly formatterCategory = formatterCategory;
    protected readonly selectFilterDimension = selectFilterDimension;
    protected readonly selectFilterParticipation = selectFilterParticipation;
}
