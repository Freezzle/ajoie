import {Component, forwardRef, Input} from '@angular/core';
import {
    ControlValueAccessor,
    FormControl,
    FormGroup,
    NG_VALUE_ACCESSOR,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';
import {IBankAccount} from '../../../admin/common/bank-account.model';
import SharedModule from '../../shared.module';
import {TextBoxComponent} from '../text-box/text-box.component';

export interface BankAccountFormValue {
    iban: string;
    accountHolder: string;
    bic?: string | null;
}

@Component({
               selector: 'app-bank-account-form',
               templateUrl: './bank-account-form.component.html',
               imports: [SharedModule, ReactiveFormsModule, TextBoxComponent],
               providers: [
                   {
                       provide: NG_VALUE_ACCESSOR,
                       useExisting: forwardRef(() => BankAccountFormComponent),
                       multi: true
                   }
               ]
           })
export class BankAccountFormComponent implements ControlValueAccessor {
    @Input() required = false;

    bankAccountForm = new FormGroup({
                                        iban: new FormControl<string>('', [Validators.required]),
                                        accountHolder: new FormControl<string>('', [Validators.required]),
                                        bic: new FormControl<string | null>(null)
                                    });

    private onChange: (value: BankAccountFormValue | null) => void = () => {
    };
    private onTouched: () => void = () => {
    };

    constructor() {
        this.bankAccountForm.valueChanges.subscribe(value => {
            this.onChange(value as BankAccountFormValue);
        });
    }

    writeValue(value: IBankAccount | null): void {
        if (value) {
            this.bankAccountForm.patchValue(value, {emitEvent: false});
        } else {
            this.bankAccountForm.reset({}, {emitEvent: false});
        }
    }

    registerOnChange(fn: (value: BankAccountFormValue | null) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        if (isDisabled) {
            this.bankAccountForm.disable();
        } else {
            this.bankAccountForm.enable();
        }
    }
}
