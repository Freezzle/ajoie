import {Component, inject, Input} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';

import SharedModule from '../../../shared/shared.module';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {CheckboxBoxComponent} from '../../../shared/components/checkbox-box/checkbox-box.component';
import {ChipsBoxComponent} from '../../../shared/components/chips-box/chips-box.component';
import {CounterBoxComponent} from '../../../shared/components/counter-box/counter-box.component';
import {SelectBoxComponent} from '../../../shared/components/select-box/select-box.component';
import {TextBoxComponent} from '../../../shared/components/text-box/text-box.component';
import {TextareaBoxComponent} from '../../../shared/components/textarea-box/textarea-box.component';
import {Category, formatterCategory} from '../../../admin/enumerations/category.model';
import {IPublicDimension, IRegistrationPrices} from '../../registration.model';
import {formatPrice, priceHint} from '../../registration-price.util';
import {RegistrationFormService, ServicesFormGroup} from '../../registration-form.service';
import {ServiceQuestionCardComponent} from './service-question-card/service-question-card.component';

@Component({
               selector: 'app-services-step',
               imports: [
                   SharedModule,
                   ReactiveFormsModule,
                   ButtonBoxComponent,
                   CheckboxBoxComponent,
                   ChipsBoxComponent,
                   CounterBoxComponent,
                   SelectBoxComponent,
                   TextBoxComponent,
                   TextareaBoxComponent,
                   ServiceQuestionCardComponent
               ],
               templateUrl: './services-step.component.html'
           })
export class ServicesStepComponent {
    @Input({required: true}) form!: ServicesFormGroup;
    @Input() dimensions: IPublicDimension[] = [];
    @Input() prices: IRegistrationPrices | null = null;
    @Input() showErrors: boolean = false;

    private formService = inject(RegistrationFormService);
    private translateService = inject(TranslateService);

    readonly categories: Category[] = [
        Category.THERAPIST,
        Category.ARTISANAT,
        Category.MEDIUMNITY,
        Category.ENERGETIC,
        Category.MISCELLANEOUS
    ];

    protected readonly formatterCategory = formatterCategory;

    formatterDimension = (dimension: IPublicDimension): string => {
        if (!dimension) {
            return '';
        }
        const price = formatPrice(dimension.price);
        return price ? `${dimension.dimension} — ${price}` : dimension.dimension;
    };

    get sharedStandHint(): string | null {
        return this.surcharge(this.prices?.priceSharingStand);
    }

    get conferenceHint(): string | null {
        return this.surcharge(this.prices?.priceConference);
    }

    get workshopHint(): string | null {
        return this.surcharge(this.prices?.priceWorkshop);
    }

    private surcharge(price: number | null | undefined): string | null {
        return priceHint(this.translateService, 'registration.price.surcharge', price);
    }

    setAnswer(controlName: 'wantStand' | 'wantConference' | 'wantWorkshop', value: boolean): void {
        this.form.controls[controlName].setValue(value);
    }

    addConference(): void {
        this.form.controls.conferences.push(this.formService.createTalkGroup());
    }

    removeConference(index: number): void {
        this.form.controls.conferences.removeAt(index);
    }

    addWorkshop(): void {
        this.form.controls.workshops.push(this.formService.createTalkGroup());
    }

    removeWorkshop(index: number): void {
        this.form.controls.workshops.removeAt(index);
    }
}
