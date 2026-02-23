import {Component, Input, OnInit, Self} from '@angular/core';
import {CommonModule} from '@angular/common';
import SharedModule from '../../shared.module';
import {
    ControlValueAccessor,
    FormControl,
    FormsModule,
    NgControl,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';
import {ErrorBoxComponent} from '../../error-box/error-box.component';
import {Listbox} from 'primeng/listbox';
import {PrimeTemplate} from 'primeng/api';

export interface PicklistOption {
    id: string;
    label: string;
}

@Component({
    imports: [CommonModule, SharedModule, ReactiveFormsModule, ErrorBoxComponent, Listbox, FormsModule, PrimeTemplate],
    selector: 'picklist-box',
    templateUrl: './picklist-box.component.html',
    standalone: true
})
export class PicklistBoxComponent implements ControlValueAccessor, OnInit {
    @Input() translateKey: string | undefined;
    @Input() fieldName: string = '';
    @Input() options: PicklistOption[] = [];
    @Input() sourceHeader: string = 'common.available';
    @Input() targetHeader: string = 'common.selected';

    selectedItems: PicklistOption[] = [];
    disabled: boolean = false;
    protected readonly Validators = Validators;

    private onChange: (value: any) => void = () => {};
    private onTouched: () => void = () => {};

    constructor(@Self() public controlDir: NgControl) {
        this.controlDir.valueAccessor = this;
    }

    ngOnInit(): void {
        // Rien à initialiser, le listbox gère tout
    }

    get control(): FormControl<PicklistOption[]> {
        return this.controlDir.control as FormControl<PicklistOption[]>;
    }

    // ===== Méthodes ControlValueAccessor =====

    /**
     * Appelée quand Angular veut écrire une valeur dans le composant
     */
    writeValue(value: PicklistOption[] | null): void {
        if (value && Array.isArray(value)) {
            // Créer une copie pour éviter les problèmes de référence
            this.selectedItems = [...value];
        } else {
            this.selectedItems = [];
        }
    }

    /**
     * Enregistre la fonction à appeler quand la valeur change
     */
    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    /**
     * Enregistre la fonction à appeler quand le composant est touché
     */
    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    /**
     * Appelée quand le FormControl est activé/désactivé
     */
    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    /**
     * Appelée quand l'utilisateur change la sélection dans le listbox
     */
    onSelectionChange(selected: PicklistOption[]): void {
        // Créer une copie profonde pour forcer la détection de changement
        const newValue = selected ? selected.map(item => ({...item})) : [];

        // Notifier Angular Reactive Forms
        this.onChange(newValue);
        this.onTouched();
    }
}
