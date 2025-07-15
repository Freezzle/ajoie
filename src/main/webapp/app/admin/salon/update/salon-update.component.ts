import {Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {finalize} from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import {FormArray, FormControl, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';

import {ISalon} from '../model/salon.interface';
import {SalonService} from '../service/salon.service';
import {PriceStandGroup, SalonFormGroup, SalonFormService} from '../service/salon-form.service';
import {ErrorModel} from '../../../shared/field-error/error.model';
import {State} from '../../enumerations/state.model';
import {Status} from '../../enumerations/status.model';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {TextBoxComponent} from '../../../shared/components/text-box/text-box.component';
import {TextareaBoxComponent} from '../../../shared/components/textarea-box/textarea-box.component';
import {DateBoxComponent} from '../../../shared/components/date-box/date-box.component';
import {sortPriceStandSalon} from '../model/price-stand-salon.interface';
import {AlertComponent} from "../../../shared/alert/alert.component";
import {AlertErrorComponent} from "../../../shared/alert/alert-error.component";
import {CurrencyBoxComponent} from "../../../shared/components/currency-box/currency-box.component";
import {NumberBoxComponent} from "../../../shared/components/number-box/number-box.component";
import {TableModule} from "primeng/table";

@Component({
    selector: 'jhi-salon-update',
    templateUrl: './salon-update.component.html',
    imports: [
        SharedModule,
        FormsModule,
        ReactiveFormsModule,
        ButtonBoxComponent,
        TextBoxComponent,
        TextareaBoxComponent,
        DateBoxComponent,
        AlertComponent,
        AlertErrorComponent,
        CurrencyBoxComponent,
        NumberBoxComponent,
        TableModule,
    ]
})
export class SalonUpdateComponent implements OnInit {
    protected salonService = inject(SalonService);
    protected salonFormService = inject(SalonFormService);
    protected activatedRoute = inject(ActivatedRoute);

    isLoading = false;
    initialSalon: ISalon | null = null;
    isReadOnly = true;
    editForm: FormGroup<SalonFormGroup> = this.salonFormService.createSalonFormGroup(null);

    ngOnInit(): void {
        this.activateReadOnlyMode(false);

        this.activatedRoute.data
            .subscribe((data) => {
                this.initialSalon = data['salon'] as ISalon;
                this.isReadOnly = data['readonly'];

                this.processSalonData();

                this.editForm = this.salonFormService.createSalonFormGroup(this.initialSalon!);

                this.isReadOnly ? this.activateReadOnlyMode() : this.activateEditMode();
            });
    }

    private processSalonData(): void {
        if (!this.initialSalon) {
            this.initialSalon = {} as ISalon;
            this.initialSalon.priceStandSalons = [];
        }

        sortPriceStandSalon(this.initialSalon.priceStandSalons ?? []);
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

    addPriceStand(): void {
        const newLine = new FormGroup<PriceStandGroup>({
            id: new FormControl(null),
            price: new FormControl(null),
            dimension: new FormControl(null),
            widthMeter: new FormControl(null),
            heightMeter: new FormControl(null)
        });

        this.editForm.controls['priceStandSalons'].push(this.salonFormService.createPriceStand(null));
    }

    get priceStandSalons(): FormArray<FormGroup<PriceStandGroup>> {
        return this.editForm.controls.priceStandSalons;
    }

    protected readonly ErrorModel = ErrorModel;
    protected readonly State = State;
    protected readonly Status = Status;
}
