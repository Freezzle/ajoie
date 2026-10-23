import {Component, DoCheck, forwardRef, inject, Injector, Input, OnInit} from '@angular/core';
import {
    AbstractControl,
    ControlValueAccessor,
    FormControl,
    FormGroup,
    NG_VALUE_ACCESSOR,
    NgControl,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';
import {IAddress} from '../../../admin/common/address.model';
import SharedModule from '../../shared.module';
import {SelectBoxComponent} from '../select-box/select-box.component';
import {CountryService, formatterCountry} from '../../country.service';
import {TextBoxComponent} from '../text-box/text-box.component';

export interface AddressFormValue {
    formalLine?: string | null;
    fullName?: string | null;
    postalCase?: string | null;
    street?: string | null;
    houseNumber?: string | null;
    postalCode?: string | null;
    city?: string | null;
    isoCountry?: string | null;
    extraLine?: string | null;
}

@Component({
               selector: 'app-address-form',
               templateUrl: './address-form.component.html',
               imports: [SharedModule, ReactiveFormsModule, SelectBoxComponent, TextBoxComponent],
               providers: [
                   {
                       provide: NG_VALUE_ACCESSOR,
                       useExisting: forwardRef(() => AddressFormComponent),
                       multi: true
                   }
               ]
           })
export class AddressFormComponent implements OnInit, DoCheck, ControlValueAccessor {
    @Input() required = false;
    @Input() showFormalFields = false;
    /** Exige en plus le nom complet (utilisé pour l'adresse de facturation). */
    @Input() requireFullName = false;

    countryService = inject(CountryService);

    addressForm = new FormGroup({
                                    id: new FormControl<string | null>(null),
                                    formalLine: new FormControl<string | null>(null),
                                    fullName: new FormControl<string | null>(null),
                                    postalCase: new FormControl<string | null>(null),
                                    street: new FormControl<string | null>(null),
                                    houseNumber: new FormControl<string | null>(null),
                                    postalCode: new FormControl<string | null>(null),
                                    city: new FormControl<string | null>(null),
                                    isoCountry: new FormControl<string | null>('CH'),
                                    extraLine: new FormControl<string | null>(null)
                                });

    private injector = inject(Injector);
    private parentControl: AbstractControl | null = null;
    private parentTouched = false;
    private onChange: (value: AddressFormValue | null) => void = () => {
    };
    private onTouched: () => void = () => {
    };

    constructor() {
        this.addressForm.valueChanges.subscribe(value => {
            this.onChange(value);
        });
    }

    ngOnInit(): void {
        this.updateValidators();
    }

    /**
     * Le formulaire interne est invisible du formulaire parent : sans cette synchronisation, un
     * `markAllAsTouched()` sur le parent n'afficherait aucune erreur sur les champs d'adresse.
     * <p>
     * La résolution est faite ici (et non dans `ngOnInit`) car la directive `formControlName` n'a
     * pas encore exposé son contrôle au moment de l'initialisation du composant.
     */
    ngDoCheck(): void {
        this.parentControl ??= this.injector.get(NgControl, null, {optional: true})?.control ?? null;

        const touched = this.parentControl?.touched ?? false;
        if (touched === this.parentTouched) {
            return;
        }

        this.parentTouched = touched;
        if (touched) {
            this.addressForm.markAllAsTouched();
        } else {
            this.addressForm.markAsUntouched();
        }
    }

    writeValue(value: IAddress | null): void {
        if (value) {
            this.addressForm.patchValue(value, {emitEvent: false});
        } else {
            this.addressForm.reset({isoCountry: 'CH'}, {emitEvent: false});
        }
    }

    registerOnChange(fn: (value: AddressFormValue | null) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        if (isDisabled) {
            this.addressForm.disable();
        } else {
            this.addressForm.enable();
        }
    }

    updateValidators(): void {
        const validators = this.required ? [Validators.required] : [];
        this.addressForm.get('street')?.setValidators(validators);
        this.addressForm.get('postalCode')?.setValidators(validators);
        this.addressForm.get('houseNumber')?.setValidators(validators);
        this.addressForm.get('city')?.setValidators(validators);
        this.addressForm.get('isoCountry')?.setValidators(validators);
        this.addressForm.get('fullName')?.setValidators(
            this.required && this.requireFullName ? [Validators.required] : []);
        this.addressForm.updateValueAndValidity();
    }

    protected readonly formatterCountry = formatterCountry;
}
