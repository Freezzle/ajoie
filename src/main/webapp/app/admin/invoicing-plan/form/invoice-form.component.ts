import {Component, computed, inject, Input, OnDestroy, OnInit, signal} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import SharedModule from 'app/shared/shared.module';
import {TextBoxComponent} from '../../../shared/components/text-box/text-box.component';
import {TextareaBoxComponent} from '../../../shared/components/textarea-box/textarea-box.component';
import {CurrencyBoxComponent} from '../../../shared/components/currency-box/currency-box.component';
import {NumberBoxComponent} from '../../../shared/components/number-box/number-box.component';
import {RadioBoxComponent} from '../../../shared/components/radio-box/radio-box.component';
import {DialogDraftService} from '../../../shared/services/dialog-draft.service';
import {IInvoice} from '../model/invoicing-plan.interface';
import {
    formatterInvoiceNature,
    INVOICE_NATURES,
    InvoiceNature,
    invoiceNatureHintKey,
    isNegativeNature
} from '../../enumerations/invoice-nature.model';

@Component({
    selector: 'app-invoice-form',
    templateUrl: './invoice-form.component.html',
    imports: [
        SharedModule,
        ReactiveFormsModule,
        TextBoxComponent,
        TextareaBoxComponent,
        CurrencyBoxComponent,
        NumberBoxComponent,
        RadioBoxComponent,
    ]
})
export class InvoiceFormComponent implements OnInit, OnDestroy {

    /** Données existantes en mode édition, null en mode création. */
    @Input() invoice: IInvoice | null = null;

    form!: FormGroup;

    readonly natures = INVOICE_NATURES;

    private readonly fb = inject(FormBuilder);
    private readonly draftService = inject(DialogDraftService);
    private readonly translateService = inject(TranslateService);

    private readonly nature = signal<InvoiceNature>(InvoiceNature.SERVICE);
    private readonly total = signal<number>(0);

    /** Aperçu de l'effet sur la facture, affiché uniquement pour une nature négative. */
    readonly effect = computed<string | null>(() => {
        if (!isNegativeNature(this.nature()) || !this.total()) {
            return null;
        }

        return this.translateService.instant('invoicingPlan.invoice.nature.effect',
                                             {amount: this.total().toFixed(2)}) as string;
    });

    readonly natureLabel = (nature: InvoiceNature): string => formatterInvoiceNature(nature);

    readonly natureHint = (nature: InvoiceNature): string =>
        this.translateService.instant(invoiceNatureHintKey(nature)) as string;

    ngOnInit(): void {
        const inv = this.invoice;

        this.form = this.fb.group({
            nature:           [inv?.nature ?? InvoiceNature.SERVICE, [Validators.required]],
            label:            [inv?.label ?? '', [Validators.maxLength(500)]],
            customAmount:     [Math.abs(inv?.customAmount ?? 0) || null, [Validators.required, Validators.min(0.01)]],
            quantity:         [inv?.quantity ?? 1, [Validators.required, Validators.min(1)]],
            extraInformation: [inv?.extraInformation ?? ''],
        });

        this.refreshPreview();
        this.form.valueChanges.subscribe(() => this.refreshPreview());

        this.draftService.registerDraft(() => {
            if (this.form.invalid) return null;
            const raw = this.form.getRawValue();
            // Le montant est saisi en valeur absolue : c'est la nature qui porte le signe.
            const amount = Math.abs(raw.customAmount ?? 0);
            return {
                nature:           raw.nature,
                label:            raw.label?.trim() || null,
                customAmount:     raw.nature === InvoiceNature.SERVICE ? amount : -amount,
                quantity:         raw.quantity,
                extraInformation: raw.extraInformation?.trim() || null,
            };
        });
    }

    ngOnDestroy(): void {
        this.draftService.unregisterDraft();
    }

    private refreshPreview(): void {
        const raw = this.form.getRawValue();
        this.nature.set(raw.nature);
        this.total.set(Math.abs(raw.customAmount ?? 0) * (raw.quantity ?? 1));
    }
}
