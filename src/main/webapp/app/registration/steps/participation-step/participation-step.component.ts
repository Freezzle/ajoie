import {Component, Input} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {inject} from '@angular/core';

import SharedModule from '../../../shared/shared.module';
import {CheckboxBoxComponent} from '../../../shared/components/checkbox-box/checkbox-box.component';
import {CounterBoxComponent} from '../../../shared/components/counter-box/counter-box.component';
import {RadioBoxComponent} from '../../../shared/components/radio-box/radio-box.component';
import {TextBoxComponent} from '../../../shared/components/text-box/text-box.component';
import {TextareaBoxComponent} from '../../../shared/components/textarea-box/textarea-box.component';
import {RegistrationCardComponent} from '../../../shared/components/registration-card/registration-card.component';
import {
    InvoiceSendingMethod
} from '../../../admin/enumerations/invoice-sending-method.model';
import {registrationInvoiceMethodKey} from '../../registration-invoice.util';
import {registrationModePaymentMealsKey} from '../../registration-meal-payment.util';
import {
    ModePaymentMeals
} from '../../../admin/enumerations/mode-payment-meals.model';
import {IRegistrationPrices} from '../../registration.model';
import {priceHint} from '../../registration-price.util';
import {ParticipationFormGroup} from '../../registration-form.service';

@Component({
               selector: 'app-participation-step',
               imports: [
                   SharedModule,
                   ReactiveFormsModule,
                   CheckboxBoxComponent,
                   CounterBoxComponent,
                   RadioBoxComponent,
                   TextBoxComponent,
                   TextareaBoxComponent,
                   RegistrationCardComponent
               ],
               templateUrl: './participation-step.component.html'
           })
export class ParticipationStepComponent {
    @Input({required: true}) form!: ParticipationFormGroup;
    @Input() prices: IRegistrationPrices | null = null;
    @Input() email: string | null = null;
    /** Vrai si l'exposant a saisi une adresse de facturation distincte. */
    @Input() hasBillingAddress: boolean = false;

    readonly modePaymentMealsValues: ModePaymentMeals[] = [ModePaymentMeals.MIXED, ModePaymentMeals.SEPARATE];
    readonly invoiceSendingMethodValues: InvoiceSendingMethod[] =
        [InvoiceSendingMethod.EMAIL, InvoiceSendingMethod.POSTAL];

    protected readonly formatterModePaymentMeals = registrationModePaymentMealsKey;

    private translateService = inject(TranslateService);

    /**
     * Le libellé de l'envoi postal dépend de l'adresse réellement utilisée :
     * adresse de facturation si elle est renseignée, sinon adresse de courrier.
     */
    formatterInvoiceMethod = (method: InvoiceSendingMethod | null): string =>
        registrationInvoiceMethodKey(method, this.hasBillingAddress);

    get totalMeals(): number {
        return (this.form.controls.nbMeal1.value ?? 0) + (this.form.controls.nbMeal2.value ?? 0) +
            (this.form.controls.nbMeal3.value ?? 0);
    }

    mealHint(price: number | null | undefined): string | null {
        return priceHint(this.translateService, 'registration.price.perMeal', price);
    }

    invoiceMethodHint = (method: InvoiceSendingMethod): string | null => {
        if (method === InvoiceSendingMethod.EMAIL) {
            return this.email || null;
        }
        if (method !== InvoiceSendingMethod.POSTAL) {
            return null;
        }
        return priceHint(this.translateService, 'registration.price.surcharge', this.prices?.pricePostalFee);
    };
}
