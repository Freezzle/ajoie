import {Component, Input, Optional, Self, TemplateRef} from '@angular/core';
import {ControlValueAccessor, FormControl, FormsModule, NgControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {AutoComplete, AutoCompleteCompleteEvent} from 'primeng/autocomplete';
import {IftaLabel} from 'primeng/iftalabel';
import {PrimeTemplate} from 'primeng/api';

import SharedModule from '../../shared.module';
import {ErrorBoxComponent} from '../../error-box/error-box.component';

/** Minuscules sans accents, pour comparer des noms saisis à la main. */
export function normalizeText(value: string): string {
    return value.trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

/**
 * Champ de saisie avec suggestions : l'utilisateur choisit dans la liste ou
 * saisit librement sa propre valeur. La valeur du contrôle est toujours la
 * chaîne saisie ou choisie.
 */
@Component({
               imports: [
                   SharedModule,
                   ReactiveFormsModule,
                   FormsModule,
                   ErrorBoxComponent,
                   IftaLabel,
                   AutoComplete,
                   PrimeTemplate
               ],
               selector: 'autocomplete-box',
               templateUrl: './autocomplete-box.component.html',
               styleUrl: './autocomplete-box.component.scss'
           })
export class AutocompleteBoxComponent implements ControlValueAccessor {
    @Input() translateKey: string | undefined;
    @Input() fieldName: string = '';
    @Input() placeholder: string | undefined;
    @Input() maxLength: number = 255;
    /** Valeurs proposées, filtrées à la saisie. */
    @Input() suggestions: string[] = [];
    /** Affiche la flèche qui déroule toutes les suggestions. */
    @Input() dropdown: boolean = true;
    /** Gabarit facultatif d'une option (la valeur est en contexte implicite). */
    @Input() optionTemplate: TemplateRef<unknown> | undefined;

    protected readonly Validators = Validators;

    value: string | null = null;
    filtered: string[] = [];
    disabled = false;

    constructor(@Self() @Optional() public controlDir: NgControl | null) {
        if (this.controlDir) {
            this.controlDir.valueAccessor = this;
        }
    }

    get control(): FormControl<string | null> | null {
        return this.controlDir?.control as FormControl<string | null> | null;
    }

    get isRequired(): boolean {
        return this.control?.hasValidator(Validators.required) ?? false;
    }

    onChange: (value: string | null) => void = () => undefined;
    onTouched: () => void = () => undefined;

    writeValue(value: string | null): void {
        this.value = value;
    }

    registerOnChange(fn: (value: string | null) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    /** Filtre sans tenir compte de la casse ni des accents. */
    search(event: AutoCompleteCompleteEvent): void {
        const query = normalizeText(event.query);

        this.filtered = this.suggestions.filter(suggestion => normalizeText(suggestion).includes(query));
    }

    /** Saisie libre : chaque frappe met à jour le contrôle. */
    handleInput(value: string): void {
        this.value = value === '' ? null : value;
        this.onChange(this.value);
    }

    handleSelect(value: string): void {
        this.value = value;
        this.onChange(value);
        this.onTouched();
    }

    handleBlur(): void {
        this.onTouched();
    }
}
