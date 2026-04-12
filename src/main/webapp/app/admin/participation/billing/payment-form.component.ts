import {Component, inject, Input, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import SharedModule from 'app/shared/shared.module';
import {TextBoxComponent} from '../../../shared/components/text-box/text-box.component';
import {CurrencyBoxComponent} from '../../../shared/components/currency-box/currency-box.component';
import {DateBoxComponent} from '../../../shared/components/date-box/date-box.component';
import {SelectBoxComponent} from '../../../shared/components/select-box/select-box.component';
import {DialogDraftService} from '../../../shared/services/dialog-draft.service';
import {IPayment} from '../model/invoicing-plan.interface';
import {Mode} from '../../enumerations/mode.model';
import {TranslateService} from '@ngx-translate/core';

@Component({
    selector: 'app-payment-form',
    templateUrl: './payment-form.component.html',
    imports: [
        CommonModule,
        SharedModule,
        ReactiveFormsModule,
        TextBoxComponent,
        CurrencyBoxComponent,
        DateBoxComponent,
        SelectBoxComponent,
    ]
})
export class PaymentFormComponent implements OnInit, OnDestroy {

    /** Données existantes en mode édition, null en mode création. */
    @Input() payment: IPayment | null = null;

    form!: FormGroup;

    modeOptions: Mode[] = [];
    modeFormatter: (m: any) => string = () => '';

    private readonly fb = inject(FormBuilder);
    private readonly draftService = inject(DialogDraftService);
    private readonly translate = inject(TranslateService);

    ngOnInit(): void {
        const pay = this.payment;

        // Options du mode de paiement
        this.modeOptions = Object.values(Mode);
        this.modeFormatter = (m: any) => m ? this.translate.instant('payment.type.list.' + m) as string : '';

        // Date de paiement : si création → aujourd'hui
        const billingDate = this.parseBillingDate(pay?.billingDate);

        this.form = this.fb.group({
            billingDate:      [billingDate, [Validators.required]],
            paymentMode:      [pay?.paymentMode ?? Mode.BANK, [Validators.required]],
            amount:           [pay?.amount ?? null, [Validators.required, Validators.min(0)]],
            extraInformation: [pay?.extraInformation ?? ''],
        });

        this.draftService.registerDraft(() => {
            if (this.form.invalid) return null;
            const raw = this.form.getRawValue();
            return {
                billingDate:      this.formatDate(raw.billingDate),
                paymentMode:      raw.paymentMode,
                amount:           raw.amount,
                extraInformation: raw.extraInformation?.trim() || null,
            };
        });
    }

    ngOnDestroy(): void {
        this.draftService.unregisterDraft();
    }

    private parseBillingDate(value: any): Date {
        if (!value) return new Date();
        // Objet dayjs (a .toDate())
        if (typeof value.toDate === 'function') return value.toDate();
        // Date natif
        if (value instanceof Date) return value;
        // String ISO ou timestamp
        const d = new Date(value);
        return isNaN(d.getTime()) ? new Date() : d;
    }

    private formatDate(date: Date | string): string {
        if (typeof date === 'string') return date;
        return date.toISOString();
    }
}
