import {Component, inject, Input, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import SharedModule from 'app/shared/shared.module';
import {TextBoxComponent} from '../../../shared/components/text-box/text-box.component';
import {TextareaBoxComponent} from '../../../shared/components/textarea-box/textarea-box.component';
import {CurrencyBoxComponent} from '../../../shared/components/currency-box/currency-box.component';
import {NumberBoxComponent} from '../../../shared/components/number-box/number-box.component';
import {DialogDraftService} from '../../../shared/services/dialog-draft.service';
import {IInvoice} from '../model/invoicing-plan.interface';

@Component({
    selector: 'app-invoice-form',
    templateUrl: './invoice-form.component.html',
    imports: [
        CommonModule,
        SharedModule,
        ReactiveFormsModule,
        TextBoxComponent,
        TextareaBoxComponent,
        CurrencyBoxComponent,
        NumberBoxComponent,
    ]
})
export class InvoiceFormComponent implements OnInit, OnDestroy {

    /** Données existantes en mode édition, null en mode création. */
    @Input() invoice: IInvoice | null = null;

    form!: FormGroup;

    private readonly fb = inject(FormBuilder);
    private readonly draftService = inject(DialogDraftService);

    ngOnInit(): void {
        const inv = this.invoice;
        this.form = this.fb.group({
            label:            [inv?.label ?? '', [Validators.maxLength(500)]],
            customAmount:     [inv?.customAmount ?? null, [Validators.required, Validators.min(0)]],
            quantity:         [inv?.quantity ?? 1, [Validators.required, Validators.min(1)]],
            extraInformation: [inv?.extraInformation ?? ''],
        });

        this.draftService.registerDraft(() => {
            if (this.form.invalid) return null;
            const raw = this.form.getRawValue();
            return {
                label:            raw.label?.trim() || null,
                customAmount:     raw.customAmount,
                quantity:         raw.quantity,
                extraInformation: raw.extraInformation?.trim() || null,
            };
        });
    }

    ngOnDestroy(): void {
        this.draftService.unregisterDraft();
    }
}
