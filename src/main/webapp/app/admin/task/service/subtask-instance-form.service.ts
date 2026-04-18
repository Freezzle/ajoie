import {Injectable} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {DateInputType, ISubtaskInstance} from '../model/task-instance.interface';

export type SubtaskInstanceFormGroup = {
    title: FormControl<string>;
    description: FormControl<string | null>;
    responsible: FormControl<string | null>;
    supplierInfo: FormControl<string | null>;
    dueDateType: FormControl<DateInputType>;
    dueDateFixed: FormControl<Date | null>;
    dueDateOffset: FormControl<number | null>;
    dueDateOffsetAbs: FormControl<number | null>;
    dueDateOffsetDir: FormControl<string>;
    snoozeUntilType: FormControl<DateInputType | null>;
    snoozeFixed: FormControl<Date | null>;
    snoozeOffset: FormControl<number | null>;
    snoozeOffsetAbs: FormControl<number | null>;
    recurring: FormControl<boolean>;
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
            dueDateOffsetAbs: new FormControl(s?.dueDateType === 'OFFSET' && s.dueDateOffset != null ? Math.abs(s.dueDateOffset) : null, [Validators.min(0), Validators.max(999)]),
            dueDateOffsetDir: new FormControl(s?.dueDateType === 'OFFSET' && (s.dueDateOffset ?? 0) < 0 ? 'BEFORE' : 'AFTER', {nonNullable: true, validators: [Validators.required]}),
            snoozeUntilType: new FormControl<DateInputType | null>(s?.snoozeUntilType ?? null),
            snoozeFixed: new FormControl(s?.snoozeUntilType === 'FIXED' && s?.snoozedUntil ? new Date(s.snoozedUntil + 'T00:00:00') : null),
            snoozeOffset: new FormControl(s?.snoozeUntilType === 'OFFSET' ? s.snoozeOffset : null, [Validators.min(0), Validators.max(999)]),
            snoozeOffsetAbs: new FormControl(s?.snoozeUntilType === 'OFFSET' ? s.snoozeOffset : null, [Validators.min(0), Validators.max(999)]),
            recurring: new FormControl(s?.recurring ?? true, {nonNullable: true}),
        });
    }

    /**
     * Registers value-change subscriptions for offset sync and conditional validators.
     * Returns a Subscription that the caller must unsubscribe on destroy.
     */
    registerSyncSubscriptions(form: FormGroup<SubtaskInstanceFormGroup>): Subscription {
        const subscriptions = new Subscription();

        // Sync dueDateOffsetAbs + dueDateOffsetDir → dueDateOffset (signed)
        const syncDueDate = () => {
            const abs = form.get('dueDateOffsetAbs')?.value;
            const dir = form.get('dueDateOffsetDir')?.value;
            if (abs == null) {
                form.get('dueDateOffset')?.setValue(null, {emitEvent: false});
            } else {
                const signed = Number(abs) * (dir === 'BEFORE' ? -1 : 1);
                form.get('dueDateOffset')?.setValue(signed, {emitEvent: false});
            }
        };
        subscriptions.add(form.get('dueDateOffsetAbs')!.valueChanges.subscribe(syncDueDate));
        subscriptions.add(form.get('dueDateOffsetDir')!.valueChanges.subscribe(syncDueDate));

        // Dynamic validators based on dueDateType
        const updateDueDateValidators = (type: string) => {
            const fixedCtrl = form.get('dueDateFixed')!;
            const absCtrl = form.get('dueDateOffsetAbs')!;
            if (type === 'FIXED') {
                fixedCtrl.setValidators([Validators.required]);
                absCtrl.setValidators([]);
            } else {
                fixedCtrl.setValidators([]);
                absCtrl.setValidators([Validators.required, Validators.min(0), Validators.max(999)]);
            }
            fixedCtrl.updateValueAndValidity({emitEvent: false});
            absCtrl.updateValueAndValidity({emitEvent: false});
        };
        updateDueDateValidators(form.get('dueDateType')!.value);
        subscriptions.add(form.get('dueDateType')!.valueChanges.subscribe(updateDueDateValidators));

        // Sync snoozeOffsetAbs → snoozeOffset
        subscriptions.add(form.get('snoozeOffsetAbs')!.valueChanges.subscribe(v => {
            form.get('snoozeOffset')?.setValue(v == null ? null : Number(v), {emitEvent: false});
        }));

        return subscriptions;
    }

    getSubtaskInstance(form: FormGroup<SubtaskInstanceFormGroup>): Record<string, any> {
        const raw = form.getRawValue();
        const dueDateType: DateInputType = raw.dueDateType ?? 'FIXED';
        const snoozeUntilType: DateInputType | null = raw.snoozeUntilType || null;

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
