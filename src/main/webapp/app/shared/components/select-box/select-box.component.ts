import {Component, Input, Self} from '@angular/core';
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
import {IftaLabel} from 'primeng/iftalabel';
import {Select} from 'primeng/select';
import {PrimeTemplate} from 'primeng/api';

@Component({
               imports: [
                   CommonModule,
                   SharedModule,
                   ReactiveFormsModule,
                   FormsModule,              // ✅ important
                   ErrorBoxComponent,
                   IftaLabel,
                   Select,
                   PrimeTemplate
               ],
               selector: 'select-box',
               templateUrl: './select-box.component.html'
           })
export class SelectBoxComponent implements ControlValueAccessor {
    @Input() translateKey: string | undefined;
    @Input() fieldName: string = '';
    @Input() options: any[] = [];
    @Input() dataKey: string = 'id';
    @Input() enableFilter: boolean = false;
    @Input() filterFields: string | undefined;
    @Input() needTranslation: boolean = false;

    @Input()
    formatterFunction: (a: any) => string = (a: any) => String(a ?? '');

    protected readonly Validators = Validators;

    value: any = null;
    disabled = false;

    constructor(@Self() public controlDir: NgControl) {
        this.controlDir.valueAccessor = this;
    }

    get control(): FormControl<any> {
        return this.controlDir.control as FormControl<any>;
    }

    get stringOptions(): boolean {
        return Array.isArray(this.options) && this.options.length > 0 && typeof this.options[0] === 'string';
    }

    get dataKeyToUse(): string | undefined {
        return this.stringOptions ? undefined : this.dataKey;
    }

    get filterByToUse(): string | undefined {
        if (this.stringOptions) {
            return undefined;
        }
        return this.filterFields ?? 'label,name,id';
    }

    // CVA
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

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    // ✅ fired only when user selects (onChange emitter) :contentReference[oaicite:1]{index=1}
    handleChange(event: any): void {
        // OPTIONNEL: ne réagir qu’à une vraie "validation" clavier (Enter/Espace), pas aux flèches
        const oe: any = event?.originalEvent;
        if (oe && oe instanceof KeyboardEvent) {
            if (oe.key !== 'Enter' && oe.key !== ' ') {
                return; // ignore navigation
            }
        }

        this.value = event?.value ?? null;
        this.onChange(this.value);
        this.onTouched();
    }

    // ✅ fired only when user clears (onClear emitter) :contentReference[oaicite:2]{index=2}
    handleClear(): void {
        this.value = null;
        this.onChange(null);
        this.onTouched();
    }

    getLabel(object: any): string {
        return this.formatterFunction(object);
    }
}