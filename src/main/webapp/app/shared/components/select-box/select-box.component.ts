import {Component, Input, Self} from '@angular/core';
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
    dataKey: string = 'id';

    @Input()
    enableFilter: boolean = false;

    @Input()
    filterFields: string | undefined;

    @Input()
    formatterFunction: (a: any) => string = (a: any) => {
        if (a == null) {
            return '';
        }
        if (typeof a === 'string') {
            return a;
        }
        if (typeof a === 'number' || typeof a === 'boolean' || typeof a === 'bigint') {
            return String(a);
        }
        if (typeof a === 'symbol') {
            return a.toString();
        }
        if (typeof a === 'function') {
            return `[Function ${a.name ?? 'anonymous'}]`;
        }

        if (typeof a === 'object') {
            const obj = a as Record<string, unknown>;
            const candidate = obj['label'] ?? obj['name'] ?? obj['id'];

            if (typeof candidate === 'string') {
                return candidate;
            }
            if (typeof candidate === 'number' || typeof candidate === 'boolean' || typeof candidate === 'bigint') {
                return String(candidate);
            }

            if (a instanceof Date) {
                return a.toISOString();
            }
            if (a instanceof Error) {
                return a.message;
            }

            const json = this.safeStringify(a);
            if (json) {
                return json;
            }

            // final fallback for objects (no base String(a))
            return Object.prototype.toString.call(a);
        }

        // should be unreachable, but keep total safety
        return '';
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

    /**
     * dataKey pour p-select :
     * - string[] => undefined
     * - object[] => 'id' (par défaut)
     */
    get dataKeyToUse(): string | undefined {
        return this.stringOptions ? undefined : this.dataKey;
    }


    /**
     * true si options est un tableau de string.
     */
    get stringOptions(): boolean {
        return Array.isArray(this.options) &&
            this.options.length > 0 &&
            typeof this.options[0] === 'string';
    }

    /**
     * Champs utilisés pour le filtre :
     * - string[] => undefined (PrimeNG filtre sur la valeur elle-même)
     * - object[] => filterFields ou 'label,name,id'
     */
    get filterByToUse(): string | undefined {
        if (this.stringOptions) {
            return undefined;
        }
        return this.filterFields ?? 'label,name,id';
    }

    private safeStringify(value: unknown): string | null {
        try {
            const seen = new WeakSet<object>();

            const json = JSON.stringify(value, (_key, val: unknown) => {
                if (typeof val === 'object' && val !== null) {
                    if (seen.has(val)) {
                        return '[Circular]';
                    }
                    seen.add(val);
                }
                if (typeof val === 'bigint') {
                    return val.toString();
                }
                if (typeof val === 'function') {
                    return `[Function ${val.name || 'anonymous'}]`;
                }
                if (typeof val === 'symbol') {
                    return val.toString();
                }
                return val;
            });

            return typeof json === 'string' ? json : null;
        } catch {
            return null;
        }
    }
}
