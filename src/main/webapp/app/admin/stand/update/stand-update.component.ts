import {Component, inject, OnInit} from '@angular/core';
import {HttpResponse} from '@angular/common/http';
import {ActivatedRoute} from '@angular/router';
import {combineLatest, forkJoin, of} from 'rxjs';
import {catchError, finalize, map} from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import {FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';

import {StandService} from '../service/stand.service';
import {IStand} from '../model/stand.interface';
import {StandFormGroup, StandFormService} from '../service/stand-form.service';
import {getFormattedParticipationName, IParticipation} from '../../participation/model/participation.interface';
import {formatterParticipation, ParticipationService} from '../../participation/service/participation.service';
import {formatterStatus, Status} from '../../enumerations/status.model';
import {ErrorModel} from '../../../shared/field-error/error.model';
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
    sortPriceStandSalon
} from "../../salon/model/price-stand-salon.interface";
import {AlertComponent} from "../../../shared/alert/alert.component";
import {AlertErrorComponent} from "../../../shared/alert/alert-error.component";
import {formatterExhibitor} from "../../exhibitor/service/exhibitor.service";

@Component({
    selector: 'jhi-stand-update',
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

    initialStand: IStand | null = null;
    statusValues = Object.keys(Status);
    categoryValues = Object.keys(Category);
    params: any;
    participationsOptions: IParticipation[] = [];
    dimensionsOptions: IPriceStandSalon[] = [];
    editForm: FormGroup<StandFormGroup> = this.standFormService.createStandFormGroup(null);

    ngOnInit(): void {
        this.activateReadOnlyMode(false);

        combineLatest([this.activatedRoute.paramMap, this.activatedRoute.data])
            .pipe(
                map(([params, data]) => ({
                    params,
                    isReadOnly: data['readonly'],
                    initialStand: data['stand'] as IStand,
                })),
            )
            .subscribe(({params, isReadOnly, initialStand}) => {
                this.params = params;
                this.isReadOnly = isReadOnly;
                this.initialStand = {...initialStand};

                this.editForm = this.standFormService.createStandFormGroup(initialStand);
                this.loadRelationshipsOptions(initialStand);

                isReadOnly ? this.activateReadOnlyMode(false) : this.activateEditMode();
            });
    }

    activateReadOnlyMode(reset: boolean = true): void {
        this.isReadOnly = true;
        if (reset) {
            this.editForm = this.standFormService.createStandFormGroup(this.initialStand!);
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
        const stand = this.standFormService.getStand(this.editForm);


        const saveOperation = stand.id != null
            ? this.standService.update(stand)
            : this.standService.create(stand);

        saveOperation.pipe(finalize(() => (this.isLoading = false))).subscribe(() => this.previousState());
    }

    protected loadRelationshipsOptions(stand: IStand): void {
        const idSalon = this.params.get('idSalon');
        const idParticipation = this.params.get('idParticipation');

        const participations$ = idSalon ? this.participationService.query(idSalon).pipe(
            map((res: HttpResponse<IParticipation[]>) => res.body ?? []),
            map((participations) => {
                if (idParticipation) {
                    this.editForm.get('participation')?.setValue(
                        participations.find((p) => p.id === idParticipation) || null,
                    );
                }
                return this.participationService.addParticipationsOptionsIfMissing(participations, stand?.participation);
            }),
            catchError(() => of([])),
        ) : of([]);

        const dimensions$ = this.salonService.getDimensionStands(idSalon).pipe(
            map((dimensionStands) => sortPriceStandSalon(dimensionStands)),
            catchError(() => of([])),
        );

        forkJoin({participations: participations$, dimensions: dimensions$})
            .subscribe(({participations, dimensions}) => {
                this.participationsOptions = participations;
                this.dimensionsOptions = dimensions;
            });
    }

    protected readonly ErrorModel = ErrorModel;
    protected readonly getFormattedParticipationName = getFormattedParticipationName;
    protected readonly formatterParticipation = formatterParticipation;
    protected readonly formatterDimensionStand = formatterDimensionStand;
    protected readonly formatterStatus = formatterStatus;
    protected readonly formatterCategory = formatterCategory;
}
