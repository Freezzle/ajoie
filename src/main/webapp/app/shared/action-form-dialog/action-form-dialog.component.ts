import {Component, inject, Input, OnInit, signal} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import SharedModule from 'app/shared/shared.module';
import {FieldType, RequiredField} from '../model/required-field';
import {TextBoxComponent} from '../components/text-box/text-box.component';
import {DateBoxComponent} from '../components/date-box/date-box.component';
import {NumberBoxComponent} from '../components/number-box/number-box.component';
import {PicklistBoxComponent} from '../components/picklist-box/picklist-box.component';
import {ButtonBoxComponent} from '../components/button-box/button-box.component';
import {TranslateService} from '@ngx-translate/core';
import {AlertErrorComponent} from '../alert/alert-error.component';

@Component({
               templateUrl: './action-form-dialog.component.html',
               styleUrl: './action-form-dialog.component.scss',
               imports: [SharedModule, FormsModule, ReactiveFormsModule, TextBoxComponent, DateBoxComponent,
                         NumberBoxComponent, PicklistBoxComponent, ButtonBoxComponent, AlertErrorComponent]
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
            const initialValue = field.type === FieldType.PICKLIST ? [] : null;

            const validators = field.type === FieldType.PICKLIST
                               ? [(control: any) => (!control.value || control.value.length === 0 ? {required: true} : null)]
                               : Validators.required;

            formControls[field.name] = [initialValue, validators];
        }

        this.form = this.fb.group(formControls);
    }

    submit(): void {
        if (this.form.valid) {
            const formValue = this.form.value;

            const payload = new Map<string, any>();

            for (const field of this.requiredFields) {
                const value = formValue[field.name];

                if (field.type === FieldType.PICKLIST && Array.isArray(value)) {
                    payload.set(field.name, value.map((item: any) => item.id));
                } else {
                    payload.set(field.name, value);
                }
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
