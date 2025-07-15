import {Component, Input, OnInit, Self} from '@angular/core';
import {CommonModule} from '@angular/common';
import SharedModule from '../../shared.module';
import {ControlValueAccessor, FormControl, NgControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {ErrorBoxComponent} from '../../error-box/error-box.component';
import {IftaLabel} from "primeng/iftalabel";
import {Select} from "primeng/select";
import {PrimeTemplate} from "primeng/api";

@Component({
    imports: [CommonModule, SharedModule, ReactiveFormsModule, ErrorBoxComponent, IftaLabel, Select, PrimeTemplate],
    selector: 'select-box',
    templateUrl: './select-box.component.html'
})
export class SelectBoxComponent implements ControlValueAccessor {
    @Input()
    translateKey: string | undefined;
    @Input()
    fieldName: string = '';
    @Input()
    options: any[] = [];

    @Input()
    formatterFunction: (a: any) => string = (a: any) => {
        if (!a) {
            return '';
        }
        // Si c’est un string, on le renvoie tel quel
        if (typeof a === 'string') {
            return a;
        }
        // Sinon on essaie quelques propriétés standard
        return a.label ?? a.name ?? a.id ?? JSON.stringify(a);
    };

    @Input()
    needTranslation: boolean = false;

    protected readonly Validators = Validators;

    value: string = '';

    // placeholder methods
    onChange = (_: any) => {
    };
    onTouched = () => {
    };

    constructor(@Self() public controlDir: NgControl) {
        this.controlDir.valueAccessor = this;
    }

    writeValue(value: any): void {
        this.value = value;
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    get control(): FormControl<any> {
        return this.controlDir.control as FormControl<any>;
    }

    getLabel(object: any): string {
        return this.formatterFunction(object);
    }

    get stringOptions(): boolean {
        return Array.isArray(this.options) &&
            this.options.length > 0 &&
            typeof this.options[0] === 'string';
    }

    get dataKeyToUse(): string | undefined {
        return this.stringOptions ? undefined : 'id';
    }
}
