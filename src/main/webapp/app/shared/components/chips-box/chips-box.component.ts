import {Component, Input, OnDestroy, OnInit, Self} from '@angular/core';
import SharedModule from '../../shared.module';
import {ControlValueAccessor, FormControl, NgControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {ErrorModel} from '../../field-error/error.model';
import {ErrorBoxComponent} from '../../error-box/error-box.component';
import {IftaLabel} from 'primeng/iftalabel';
import {AutoComplete} from 'primeng/autocomplete';
import {InfoIconComponent} from '../info-icon/info-icon.component';

@Component({
               imports: [SharedModule, ReactiveFormsModule, ErrorBoxComponent, IftaLabel, IftaLabel, AutoComplete,
                   InfoIconComponent],
               selector: 'chips-box',
               templateUrl: './chips-box.component.html'
           })
export class ChipsBoxComponent implements ControlValueAccessor, OnInit, OnDestroy {
    @Input()
    translateKey: string | undefined;
    @Input()
    fieldName: string = '';
    /**
     * Nombre maximum d'éléments sélectionnables. `null` (défaut) = illimité : seuls les écrans qui
     * le demandent explicitement sont contraints.
     */
    @Input()
    maxChips: number | null = null;
    /** Clé de traduction affichée dans une infobulle à côté du libellé. */
    @Input()
    infoKey: string | null = null;
    disabled: boolean = false;
    value: string = '';
    protected readonly Validators = Validators;
    protected readonly ErrorModel = ErrorModel;

    private valueSubscription: Subscription | undefined;

    constructor(@Self() public controlDir: NgControl) {
        this.controlDir.valueAccessor = this;
    }

    get control(): FormControl<any> {
        return this.controlDir.control as FormControl<any>;
    }

    ngOnInit(): void {
        // PrimeNG n'expose pas de limite native : on tronque la valeur dès qu'un élément de trop est
        // ajouté (saisie clavier, collage, données existantes).
        this.valueSubscription = this.control?.valueChanges.subscribe(() => this.enforceMaxChips());
        this.enforceMaxChips();
    }

    ngOnDestroy(): void {
        this.valueSubscription?.unsubscribe();
    }

    // placeholder methods
    onChange = (_: any) => {
    };

    onTouched = () => {
    };

    writeValue(value: any): void {
        this.value = value;
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState?(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    private enforceMaxChips(): void {
        if (this.maxChips === null) {
            return;
        }

        const current = this.control?.value;
        if (!Array.isArray(current) || current.length <= this.maxChips) {
            return;
        }

        // `emitEvent: false` évite de reboucler sur cette même souscription.
        this.control.setValue(current.slice(0, this.maxChips), {emitEvent: false});
    }
}
