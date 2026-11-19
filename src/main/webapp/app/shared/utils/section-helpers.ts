import {AbstractControl, FormGroup, Validators} from '@angular/forms';

export interface SectionDefinition {
    key: string;
    titleKey: string;
    controls: string[];
    sensitive?: boolean;
}

export type SectionCompletenessState = 'complete' | 'incomplete' | 'empty' | 'invalid';

export interface SectionCompleteness {
    state: SectionCompletenessState;
    labelKey: 'sectionCompleteness.complete'
        | 'sectionCompleteness.incomplete'
        | 'sectionCompleteness.empty'
        | 'sectionCompleteness.invalid';
    requiredCount: number;
    filledCount: number;
}

export function sectionCompleteness(form: AbstractControl | FormGroup, section: SectionDefinition, attempted = false): SectionCompleteness {
    const controls = section.controls
        .map(name => form instanceof FormGroup ? form.get(name) : null)
        .filter((control): control is AbstractControl => !!control);

    const required = controls.filter(control => control.hasValidator(Validators.required));
    const filled = controls.filter(control => {
        const value = control.value;

        if (Array.isArray(value)) {
            return value.length > 0;
        }

        return value !== null && value !== undefined && value !== '';
    });

    const valid = controls.length > 0 && controls.every(control => control.valid);

    if (attempted && !valid) {
        return {state: 'invalid', labelKey: 'sectionCompleteness.invalid', requiredCount: required.length, filledCount: filled.length};
    }
    if (filled.length === 0) {
        return {state: 'empty', labelKey: 'sectionCompleteness.empty', requiredCount: required.length, filledCount: 0};
    }
    if (valid && required.every(control => control.valid)) {
        return {state: 'complete', labelKey: 'sectionCompleteness.complete', requiredCount: required.length, filledCount: filled.length};
    }
    if (filled.length > 0) {
        return {state: 'incomplete', labelKey: 'sectionCompleteness.incomplete', requiredCount: required.length, filledCount: filled.length};
    }

    return {state: 'empty', labelKey: 'sectionCompleteness.empty', requiredCount: required.length, filledCount: 0};
}

export class SectionEditController {
    private activeKey: string | null = null;
    private readonly snapshots = new Map<string, Record<string, unknown>>();

    constructor(private readonly form: FormGroup) {}

    begin(section: SectionDefinition): void {
        this.activeKey = section.key;
        if (this.snapshots.has(section.key)) {
            return;
        }

        const snapshot: Record<string, unknown> = {};
        section.controls.forEach(name => {
            const control = this.form.get(name);
            if (control) {
                snapshot[name] = control.getRawValue();
            }
        });
        this.snapshots.set(section.key, snapshot);
    }

    cancel(section: SectionDefinition): void {
        const snapshot = this.snapshots.get(section.key) ?? {};
        section.controls.forEach(name => {
            if (Object.prototype.hasOwnProperty.call(snapshot, name)) {
                this.form.get(name)?.setValue(snapshot[name]);
            }
            this.form.get(name)?.markAsPristine();
        });
        this.snapshots.delete(section.key);
        if (this.activeKey === section.key) {
            this.activeKey = null;
        }
    }

    validate(section: SectionDefinition): boolean {
        let valid = true;
        section.controls.forEach(name => {
            const control = this.form.get(name);
            if (control) {
                control.markAsTouched();
                if (control.invalid) {
                    valid = false;
                }
            }
        });

        return valid;
    }

    payload(section: SectionDefinition): Record<string, unknown> {
        const payload: Record<string, unknown> = {};
        section.controls.forEach(name => {
            const control = this.form.get(name);
            if (control) {
                payload[name] = control.getRawValue();
            }
        });

        return payload;
    }

    finish(section: SectionDefinition): void {
        section.controls.forEach(name => this.form.get(name)?.markAsPristine());
        this.snapshots.delete(section.key);
        if (this.activeKey === section.key) {
            this.activeKey = null;
        }
    }

    activeSectionKey(): string | null {
        return this.activeKey;
    }
}
