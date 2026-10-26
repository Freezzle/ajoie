import {Component, inject, Input, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import SharedModule from 'app/shared/shared.module';
import {TextBoxComponent} from '../../../shared/components/text-box/text-box.component';
import {CurrencyBoxComponent} from '../../../shared/components/currency-box/currency-box.component';
import {DateBoxComponent} from '../../../shared/components/date-box/date-box.component';
import {SelectBoxComponent} from '../../../shared/components/select-box/select-box.component';
import {DialogDraftService} from '../../../shared/services/dialog-draft.service';
import {IPayment} from '../model/invoicing-plan.interface';
import {Mode, PAYMENT_MODES, autoPaymentLabelKey, formatterPaymentMode} from '../../enumerations/mode.model';
import {TranslateService} from '@ngx-translate/core';

@Component({
    selector: 'app-payment-form',
    templateUrl: './payment-form.component.html',
    imports: [
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
        this.modeOptions = PAYMENT_MODES;
        this.modeFormatter = (m: any) => m ? this.translate.instant(formatterPaymentMode(m)) as string : '';

        // Date de paiement : si création → aujourd'hui
        const billingDate = this.parseBillingDate(pay?.billingDate);
        const mode = pay?.paymentMode ?? Mode.BANK;

        this.form = this.fb.group({
            paymentMode:      [mode, [Validators.required]],
            label:            [{value: pay?.label ?? this.autoLabel(mode), disabled: mode !== Mode.OTHER},
                               [Validators.required, Validators.maxLength(255)]],
            billingDate:      [billingDate, [Validators.required]],
            amount:           [pay?.amount ?? null, [Validators.required, Validators.min(0)]],
            extraInformation: [pay?.extraInformation ?? ''],
        });

        // Le libellé suit le mode, sauf en « Autre » où l'admin le saisit lui-même.
        this.form.get('paymentMode')!.valueChanges.subscribe((value: Mode) => this.applyMode(value));

        this.draftService.registerDraft(() => {
            if (this.form.invalid) return null;
            const raw = this.form.getRawValue();
            return {
                billingDate:      this.formatDate(raw.billingDate),
                paymentMode:      raw.paymentMode,
                label:            trimmedOrNull(raw.label),
                amount:           raw.amount,
                extraInformation: raw.extraInformation?.trim() || null,
            };
        });
    }

    /** Vrai quand l'admin doit saisir lui-même le libellé imprimé. */
    get isCustomLabel(): boolean {
        return this.form?.get('paymentMode')?.value === Mode.OTHER;
    }

    ngOnDestroy(): void {
        this.draftService.unregisterDraft();
    }

    private applyMode(mode: Mode): void {
        const labelControl = this.form.get('label')!;

        if (mode === Mode.OTHER) {
            labelControl.enable({emitEvent: false});
            // Un libellé généré n'a plus de sens ici : on force une saisie explicite.
            if (this.isAutoLabel(labelControl.value)) {
                labelControl.setValue('', {emitEvent: false});
            }
            return;
        }

        labelControl.setValue(this.autoLabel(mode), {emitEvent: false});
        labelControl.disable({emitEvent: false});
    }

    private isAutoLabel(value: string | null): boolean {
        const label = value?.trim() ?? '';

        return !label || PAYMENT_MODES.some(mode => mode !== Mode.OTHER && this.autoLabel(mode) === label);
    }

    private autoLabel(mode: Mode): string {
        const key = autoPaymentLabelKey(mode);

        return key ? this.translate.instant(key) as string : '';
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

function trimmedOrNull(value: string | null | undefined): string | null {
    const trimmed = value?.trim();

    return trimmed && trimmed.length > 0 ? trimmed : null;
}
