import {Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {finalize} from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import {FormArray, FormControl, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';

import {ISalon} from '../model/salon.interface';
import {SalonService} from '../service/salon.service';
import {PriceStandGroup, SalonFormGroup, SalonFormService} from '../service/salon-form.service';
import {State} from '../../enumerations/state.model';
import {Status} from '../../enumerations/status.model';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {TextBoxComponent} from '../../../shared/components/text-box/text-box.component';
import {TextareaBoxComponent} from '../../../shared/components/textarea-box/textarea-box.component';
import {DateBoxComponent} from '../../../shared/components/date-box/date-box.component';
import {sortPriceStandSalon} from '../model/price-stand-salon.interface';

import {AlertErrorComponent} from '../../../shared/alert/alert-error.component';
import {CurrencyBoxComponent} from '../../../shared/components/currency-box/currency-box.component';
import {NumberBoxComponent} from '../../../shared/components/number-box/number-box.component';
import {TableModule} from 'primeng/table';
import {ConfirmPopup} from 'primeng/confirmpopup';

import {CardComponent} from '../../../shared/components/card/card.component';
import {ContentPageComponent} from '../../../shared/components/content-page/content-page.component';

@Component({
               selector: 'app-salon-update',
               templateUrl: './salon-update.component.html',
               imports: [
                   SharedModule,
                   FormsModule,
                   ReactiveFormsModule,
                   ButtonBoxComponent,
                   TextBoxComponent,
                   TextareaBoxComponent,
                   DateBoxComponent,
                   
                   AlertErrorComponent,
                   CurrencyBoxComponent,
                   NumberBoxComponent,
                   TableModule,
                   ConfirmPopup,
                   
                   CardComponent,
                   ContentPageComponent
               ]
           })
export class SalonUpdateComponent implements OnInit {
    isLoading = false;
    initialSalon: ISalon | null = null;
    isReadOnly = true;
    protected salonService = inject(SalonService);
    protected salonFormService = inject(SalonFormService);
    editForm: FormGroup<SalonFormGroup> = this.salonFormService.createSalonFormGroup(null);
    protected activatedRoute = inject(ActivatedRoute);
    protected readonly State = State;
    protected readonly Status = Status;

    get priceStandSalons(): FormArray<FormGroup<PriceStandGroup>> {
        return this.editForm.controls.priceStandSalons;
    }

    ngOnInit(): void {
        this.activateReadOnlyMode(false);

        this.activatedRoute.data
            .subscribe((data) => {
                this.initialSalon = data['salon'] as ISalon;
                this.isReadOnly = data['readonly'];

                this.processSalonData();

                this.editForm = this.salonFormService.createSalonFormGroup(this.initialSalon);

                if (this.isReadOnly) {
                    this.activateReadOnlyMode();
                } else {
                    this.activateEditMode();
                }
            });
    }

    activateReadOnlyMode(reset: boolean = true): void {
        this.isReadOnly = true;
        if (reset) {
            this.editForm = this.salonFormService.createSalonFormGroup(this.initialSalon);
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

    private processSalonData(): void {
        if (!this.initialSalon) {
            this.initialSalon = {} as ISalon;
            this.initialSalon.priceStandSalons = [];
        }

        sortPriceStandSalon(this.initialSalon.priceStandSalons ?? []);
    }
}
