import {Injectable} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {DateInputType, ISubtaskInstance, RepeatUnit} from '../model/task-instance.interface';

/** Nombre maximal d'occurrences créées en une fois (aligné sur le backend). */
export const MAX_REPEAT_COUNT = 12;
/** Nombre d'occurrences proposé par défaut quand la répétition est activée. */
export const DEFAULT_REPEAT_COUNT = 2;

export type SubtaskInstanceFormGroup = {
    title: FormControl<string>;
    description: FormControl<string | null>;
    responsible: FormControl<string | null>;
    supplierInfo: FormControl<string | null>;
    dueDateType: FormControl<DateInputType>;
    dueDateFixed: FormControl<Date | null>;
    dueDateOffset: FormControl<number | null>;
    snoozeUntilType: FormControl<DateInputType | null>;
    snoozeFixed: FormControl<Date | null>;
    snoozeOffset: FormControl<number | null>;
    snoozeOffsetAbs: FormControl<number | null>;
    recurring: FormControl<boolean>;
    /** Répétition activée : plusieurs sous-tâches indépendantes seront créées. */
    repeatEnabled: FormControl<boolean>;
    /** Nombre total d'occurrences, occurrence initiale comprise. */
    repeatCount: FormControl<number | null>;
    repeatUnit: FormControl<RepeatUnit>;
};

@Injectable({providedIn: 'root'})
export class SubtaskInstanceFormService {

    createFormGroup(subtask: ISubtaskInstance | null): FormGroup<SubtaskInstanceFormGroup> {
        const s = subtask;

        return new FormGroup<SubtaskInstanceFormGroup>({
            title: new FormControl(s?.title ?? '', {nonNullable: true, validators: [Validators.required, Validators.maxLength(500)]}),
            description: new FormControl(s?.description ?? null),
            responsible: new FormControl(s?.responsible ?? null),
            supplierInfo: new FormControl(s?.supplierInfo ?? null),
            dueDateType: new FormControl<DateInputType>(s?.dueDateType ?? 'OFFSET', {nonNullable: true}),
            dueDateFixed: new FormControl(s?.dueDateType === 'FIXED' && s?.dueDate ? new Date(s.dueDate + 'T00:00:00') : null),
            dueDateOffset: new FormControl(s?.dueDateType === 'OFFSET' ? s.dueDateOffset : null, [Validators.min(-999), Validators.max(999)]),
            snoozeUntilType: new FormControl<DateInputType | null>(s?.snoozeUntilType ?? null),
            snoozeFixed: new FormControl(s?.snoozeUntilType === 'FIXED' && s?.snoozedUntil ? new Date(s.snoozedUntil + 'T00:00:00') : null),
            snoozeOffset: new FormControl(s?.snoozeUntilType === 'OFFSET' ? s.snoozeOffset : null, [Validators.min(0), Validators.max(999)]),
            snoozeOffsetAbs: new FormControl(s?.snoozeUntilType === 'OFFSET' ? s.snoozeOffset : null, [Validators.min(0), Validators.max(999)]),
            recurring: new FormControl(s?.recurring ?? true, {nonNullable: true}),
            repeatEnabled: new FormControl(false, {nonNullable: true}),
            repeatCount: new FormControl<number | null>(DEFAULT_REPEAT_COUNT, [repeatCountValidator]),
            repeatUnit: new FormControl<RepeatUnit>('WEEK', {nonNullable: true, validators: [Validators.required]}),
        });
    }

    /**
     * Garde le nombre d'occurrences cohérent avec l'activation de la répétition.
     * À souscrire par l'appelant, qui doit se désabonner.
     */
    registerRepeatSync(form: FormGroup<SubtaskInstanceFormGroup>): Subscription {
        const count = form.controls.repeatCount;

        return form.controls.repeatEnabled.valueChanges.subscribe(enabled => {
            if (enabled && count.value == null) {
                count.setValue(DEFAULT_REPEAT_COUNT);
            }
            count.updateValueAndValidity();
        });
    }

    /**
     * Registers value-change subscriptions for conditional validators and snooze sync.
     * Returns a Subscription that the caller must unsubscribe on destroy.
     */
    registerSyncSubscriptions(form: FormGroup<SubtaskInstanceFormGroup>): Subscription {
        const subscriptions = new Subscription();

        // Dynamic validators based on dueDateType
        const updateDueDateValidators = (type: string) => {
            const fixedCtrl = form.get('dueDateFixed')!;
            const offsetCtrl = form.get('dueDateOffset')!;
            if (type === 'FIXED') {
                fixedCtrl.setValidators([Validators.required]);
                offsetCtrl.setValidators([Validators.min(-999), Validators.max(999)]);
            } else {
                fixedCtrl.setValidators([]);
                offsetCtrl.setValidators([Validators.required, Validators.min(-999), Validators.max(999)]);
            }
            fixedCtrl.updateValueAndValidity({emitEvent: false});
            offsetCtrl.updateValueAndValidity({emitEvent: false});
        };
        updateDueDateValidators(form.get('dueDateType')!.value);
        subscriptions.add(form.get('dueDateType')!.valueChanges.subscribe(updateDueDateValidators));

        // Sync snoozeOffsetAbs → snoozeOffset
        subscriptions.add(form.get('snoozeOffsetAbs')!.valueChanges.subscribe(v => {
            form.get('snoozeOffset')?.setValue(v == null ? null : Number(v), {emitEvent: false});
        }));

        subscriptions.add(this.registerRepeatSync(form));

        return subscriptions;
    }

    getSubtaskInstance(form: FormGroup<SubtaskInstanceFormGroup>): Record<string, any> {
        const raw = form.getRawValue();
        const dueDateType: DateInputType = raw.dueDateType ?? 'FIXED';
        const snoozeUntilType: DateInputType | null = raw.snoozeUntilType || null;
        const repeatCount = raw.repeatEnabled && raw.repeatCount && raw.repeatCount > 1 ? raw.repeatCount : null;

        return {
            title: raw.title?.trim(),
            description: raw.description?.trim() || null,
            responsible: raw.responsible?.trim() || null,
            supplierInfo: raw.supplierInfo?.trim() || null,
            dueDateType,
            dueDate: dueDateType === 'FIXED' && raw.dueDateFixed ? this.formatDate(raw.dueDateFixed) : null,
            dueDateOffset: dueDateType === 'OFFSET' ? raw.dueDateOffset : null,
            snoozeUntilType,
            snoozedUntil: snoozeUntilType === 'FIXED' && raw.snoozeFixed ? this.formatDate(raw.snoozeFixed) : null,
            snoozeOffset: snoozeUntilType === 'OFFSET' ? raw.snoozeOffset : null,
            recurring: raw.recurring ?? true,
            repeatCount,
            repeatUnit: repeatCount ? raw.repeatUnit : null,
        };
    }

    private formatDate(date: Date | string): string {
        if (typeof date === 'string') return date;
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
}

/** Le nombre d'occurrences n'est exigé (2 à 12) que si la répétition est activée. */
const repeatCountValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    if (!control.parent?.get('repeatEnabled')?.value) {
        return null;
    }

    const value = control.value as number | null;
    if (value == null) {
        return {required: true};
    }

    return value < 2 || value > MAX_REPEAT_COUNT ? {repeatCount: true} : null;
};
