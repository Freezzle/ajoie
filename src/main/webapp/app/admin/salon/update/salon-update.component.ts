import {Component, inject, OnInit} from '@angular/core';
import {HttpResponse} from '@angular/common/http';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {Observable} from 'rxjs';
import {finalize} from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';

import {IPriceStandSalon, ISalon} from '../salon.model';
import {SalonService} from '../service/salon.service';
import {SalonFormGroup, SalonFormService} from './salon-form.service';
import {DimensionStandService} from '../../dimension-stand/service/dimension-stand.service';
import {ErrorModel} from "../../../shared/field-error/error.model";
import {FieldErrorComponent} from "../../../shared/field-error/field-error.component";

@Component({
    standalone: true,
    selector: 'jhi-salon-update',
    templateUrl: './salon-update.component.html',
    imports: [SharedModule, FormsModule, ReactiveFormsModule, RouterLink, FieldErrorComponent],
})
export class SalonUpdateComponent implements OnInit {
    isSaving = false;
    salon: ISalon | null = null;
    readonlyForm = false;

    protected salonService = inject(SalonService);
    protected salonFormService = inject(SalonFormService);
    // eslint-disable-next-line @typescript-eslint/member-ordering
    editForm: SalonFormGroup = this.salonFormService.createSalonFormGroup();
    protected dimensionStandService = inject(DimensionStandService);
    protected activatedRoute = inject(ActivatedRoute);

    ngOnInit(): void {
        this.activatedRoute.data.subscribe(({salon, readonly}) => {
            if (!salon) {
                salon = {};
            }

            this.readonlyForm = readonly;

            const salonData = salon as ISalon;

            this.dimensionStandService.query().subscribe(dimensions => {
                if (dimensions.body) {
                    if (!salonData.priceStandSalons) {
                        salonData.priceStandSalons = [];
                    }
                    dimensions.body.forEach(dimensionParam => {
                        if (!salonData.priceStandSalons?.map(priceStand => priceStand.dimension?.id)
                            .includes(dimensionParam.id)) {
                            salonData.priceStandSalons?.push(
                                {price: null, dimension: dimensionParam} as IPriceStandSalon);
                        }
                    });
                }
                this.updateForm(salonData);
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
            this.subscribeToSaveResponse(this.salonService.update(salon));
        } else {
            this.subscribeToSaveResponse(this.salonService.create(salon));
        }
    }

    protected subscribeToSaveResponse(result: Observable<HttpResponse<ISalon>>): void {
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

    protected updateForm(salon: ISalon): void {
        this.salon = salon;
        this.editForm = this.salonFormService.createSalonFormGroup(salon);
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
}
