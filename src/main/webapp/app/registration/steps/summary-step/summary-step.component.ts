import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';

import SharedModule from '../../../shared/shared.module';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {CheckboxBoxComponent} from '../../../shared/components/checkbox-box/checkbox-box.component';
import {formatterCategory} from '../../../admin/enumerations/category.model';
import {formatterInvoiceMethod, InvoiceSendingMethod} from '../../../admin/enumerations/invoice-sending-method.model';
import {formatterModePaymentMeals} from '../../../admin/enumerations/mode-payment-meals.model';
import {IAddress} from '../../../admin/common/address.model';
import {IPublicDimension, IRegistrationPrices} from '../../registration.model';
import {CostEstimate, computeCostEstimate, formatPrice} from '../../registration-price.util';
import {
    ConsentsFormGroup,
    ExhibitorFormGroup,
    ParticipationFormGroup,
    ServicesFormGroup,
    TalkFormGroup
} from '../../registration-form.service';

@Component({
               selector: 'app-summary-step',
               imports: [SharedModule, ReactiveFormsModule, ButtonBoxComponent, CheckboxBoxComponent],
               templateUrl: './summary-step.component.html'
           })
export class SummaryStepComponent {
    @Input({required: true}) exhibitorForm!: ExhibitorFormGroup;
    @Input({required: true}) servicesForm!: ServicesFormGroup;
    @Input({required: true}) participationForm!: ParticipationFormGroup;
    @Input({required: true}) consentsForm!: ConsentsFormGroup;
    @Input() dimensions: IPublicDimension[] = [];
    @Input() prices: IRegistrationPrices | null = null;

    @Output() editStep = new EventEmitter<{step: number; anchor?: string}>();

    protected readonly formatterCategory = formatterCategory;
    protected readonly formatterInvoiceMethod = formatterInvoiceMethod;
    protected readonly formatterModePaymentMeals = formatterModePaymentMeals;

    get exhibitor() {
        return this.exhibitorForm.getRawValue();
    }

    get participation() {
        return this.participationForm.getRawValue();
    }

    get stand() {
        return this.servicesForm.controls.wantStand.value ? this.servicesForm.controls.stand.getRawValue() : null;
    }

    /**
     * On expose directement les FormGroup (références stables) plutôt que des valeurs recalculées :
     * un `@for` qui piste des objets recréés à chaque cycle de détection ne s'affiche pas de façon fiable.
     */
    get conferenceControls(): TalkFormGroup[] {
        return this.servicesForm.controls.wantConference.value ?
            this.servicesForm.controls.conferences.controls : [];
    }

    get workshopControls(): TalkFormGroup[] {
        return this.servicesForm.controls.wantWorkshop.value ?
            this.servicesForm.controls.workshops.controls : [];
    }

    get totalMeals(): number {
        const value = this.participation;
        return (value.nbMeal1 ?? 0) + (value.nbMeal2 ?? 0) + (value.nbMeal3 ?? 0);
    }

    formatAddress(address: IAddress | null): string {
        if (!address) {
            return '';
        }
        const street = [address.street, address.houseNumber].filter(Boolean).join(' ');
        const city = [address.postalCode, address.city].filter(Boolean).join(' ');
        return [street, city].filter(Boolean).join(', ');
    }

    dimensionLabel(dimensionId: string | null | undefined): string {
        return this.dimensions.find(d => d.id === dimensionId)?.dimension ?? '';
    }

    get costEstimate(): CostEstimate {
        const stand = this.stand;
        const participation = this.participation;

        return computeCostEstimate({
                                       prices: this.prices,
                                       dimensions: this.dimensions,
                                       standDimensionId: stand?.dimension?.id ?? null,
                                       standShared: !!stand?.shared,
                                       hasStand: !!stand,
                                       nbConferences: this.conferenceControls.length,
                                       nbWorkshops: this.workshopControls.length,
                                       nbMeal1: participation.nbMeal1 ?? 0,
                                       nbMeal2: participation.nbMeal2 ?? 0,
                                       nbMeal3: participation.nbMeal3 ?? 0,
                                       postalInvoice: participation.invoiceSendingMethod ===
                                           InvoiceSendingMethod.POSTAL
                                   });
    }

    price(value: number): string {
        return formatPrice(value) ?? '';
    }

    onEdit(step: number, anchor?: string): void {
        this.editStep.emit({step, anchor});
    }
}
