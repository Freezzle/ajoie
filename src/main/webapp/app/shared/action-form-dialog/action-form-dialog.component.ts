import {Component, inject, Input, OnInit, signal} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import SharedModule from 'app/shared/shared.module';
import {RequiredField, FieldType} from '../model/required-field';
import {TextBoxComponent} from '../components/text-box/text-box.component';
import {DateBoxComponent} from '../components/date-box/date-box.component';
import {NumberBoxComponent} from '../components/number-box/number-box.component';
import {ButtonBoxComponent} from '../components/button-box/button-box.component';
import {TranslateService} from '@ngx-translate/core';
import {AlertErrorComponent} from '../alert/alert-error.component';

@Component({
               templateUrl: './action-form-dialog.component.html',
               styleUrl: './action-form-dialog.component.scss',
               imports: [SharedModule, FormsModule, ReactiveFormsModule, TextBoxComponent, DateBoxComponent,
                         NumberBoxComponent, ButtonBoxComponent, AlertErrorComponent]
           })
export class ActionFormDialogComponent implements OnInit {

    @Input() requiredFields!: RequiredField[];
    @Input() actionLabelKey!: string;

    form!: FormGroup;
    FieldType = FieldType;
    isLoading = signal(false);

    private readonly fb = inject(FormBuilder);
    private readonly translateService = inject(TranslateService);
    public readonly activeModal = inject(NgbActiveModal);

    ngOnInit(): void {
        const formControls: { [key: string]: any } = {};

        for (const field of this.requiredFields) {
            formControls[field.name] = [null, Validators.required];
        }

        this.form = this.fb.group(formControls);
    }

    submit(): void {
        if (this.form.valid) {
            const payload = new Map<string, any>();

            for (const field of this.requiredFields) {
                payload.set(field.name, this.form.get(field.name)?.value);
            }

            this.activeModal.close(payload);
        }
    }

    cancel(): void {
        this.activeModal.dismiss();
    }

    getFieldLabel(field: RequiredField): string {
        return this.translateService.instant(field.labelKey) as string;
    }
}
