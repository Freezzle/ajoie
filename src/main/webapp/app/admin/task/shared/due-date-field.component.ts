import {ChangeDetectionStrategy, Component, effect, input} from '@angular/core';
import {takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';
import {
    AbstractControl,
    FormControl,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
    TouchedChangeEvent,
    ValidationErrors,
    Validators
} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';
import {filter, switchMap} from 'rxjs';

import {CheckboxBoxComponent} from '../../../shared/components/checkbox-box/checkbox-box.component';
import {DateBoxComponent} from '../../../shared/components/date-box/date-box.component';
import {TextBoxComponent} from '../../../shared/components/text-box/text-box.component';
import {DateInputType} from '../model/task-instance.interface';
import {addDays} from '../calendar/task-calendar.utils';
import {formatSalonOffset, offsetFromSalon, parseSalonOffset, toLocalDate} from './task-urgency.utils';

/** Sous-ensemble du formulaire piloté par ce champ. */
export interface DueDateControls {
    dueDateType: FormControl<DateInputType>;
    dueDateFixed: FormControl<Date | null>;
    dueDateOffset: FormControl<number | null>;
}

/** Refuse une saisie qui n'est pas un décalage « J± » interprétable. */
function salonOffsetValidator(control: AbstractControl): ValidationErrors | null {
    const value = (control.value ?? '') as string;

    return value.trim() === '' || parseSalonOffset(value) !== null
           ? null
           : {pattern: {requiredPattern: 'J±N'}};
}

/**
 * Échéance d'une sous-tâche : un décalage « J± » par rapport au salon et une date,
 * toujours cohérents entre eux. Décocher « Liée à la date du salon » fige la date
 * et neutralise le J±. Sans date de salon, seule la date fixe est possible.
 */
@Component({
               selector: 'due-date-field',
               imports: [
                   FormsModule,
                   ReactiveFormsModule,
                   TranslatePipe,
                   CheckboxBoxComponent,
                   DateBoxComponent,
                   TextBoxComponent
               ],
               templateUrl: './due-date-field.component.html',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class DueDateFieldComponent {
    readonly form = input.required<FormGroup<DueDateControls>>();
    /** Début du salon (`YYYY-MM-DD`) ; sans lui, le J± est impossible. */
    readonly salonStart = input<string | null>(null);

    /** Décalage saisi, par exemple « J-14 ». */
    readonly offsetControl = new FormControl<string | null>('', [salonOffsetValidator]);
    /** Date affichée, qu'elle vienne du J± ou d'une saisie directe. */
    readonly dateControl = new FormControl<Date | null>(null);
    /** Échéance calée sur la date du salon plutôt que figée. */
    readonly linkedControl = new FormControl<boolean>(true, {nonNullable: true});

    constructor() {
        this.offsetControl.valueChanges
            .pipe(takeUntilDestroyed())
            .subscribe(value => this.onOffsetInput(value ?? ''));

        this.dateControl.valueChanges
            .pipe(takeUntilDestroyed())
            .subscribe(date => this.onDateChange(date));

        this.linkedControl.valueChanges
            .pipe(takeUntilDestroyed())
            .subscribe(linked => this.onLinkedChange(linked));

        // L'erreur du champ date ne s'affiche qu'une fois « visité » : on reprend
        // l'état du formulaire parent, marqué entièrement au clic sur « Enregistrer ».
        toObservable(this.form)
            .pipe(
                switchMap(form => form.controls.dueDateFixed.events),
                filter((event): event is TouchedChangeEvent => event instanceof TouchedChangeEvent),
                takeUntilDestroyed()
            )
            .subscribe(event => {
                if (event.touched) {
                    this.dateControl.markAsTouched();
                } else {
                    this.dateControl.markAsUntouched();
                }
            });

        // Reprend l'état du formulaire à l'ouverture et à chaque changement de sous-tâche.
        effect(() => {
            const form = this.form();
            const salonStart = this.salonStart();
            let linked = form.controls.dueDateType.value === 'OFFSET';

            if (!salonStart && linked) {
                form.controls.dueDateType.setValue('FIXED');
                linked = false;
            }

            this.linkedControl.setValue(linked, {emitEvent: false});
            // Sans date de salon, « lier au salon » n'a pas de sens.
            if (salonStart) {
                this.linkedControl.enable({emitEvent: false});
            } else {
                this.linkedControl.disable({emitEvent: false});
            }

            const offset = form.controls.dueDateOffset.value;
            this.offsetControl.setValue(linked ? formatSalonOffset(offset) : '', {emitEvent: false});
            this.applyOffsetState(linked);

            const date = linked && salonStart && offset != null
                         ? new Date(`${addDays(salonStart, offset)}T00:00:00`)
                         : form.controls.dueDateFixed.value;
            this.dateControl.setValue(date ?? null, {emitEvent: false});
        });
    }

    /**
     * Le J± n'est saisissable, et obligatoire, que si l'échéance suit le salon.
     * Sinon c'est la date qui devient obligatoire, le J± n'étant plus disponible.
     */
    private applyOffsetState(linked: boolean): void {
        this.offsetControl.setValidators(linked
                                         ? [Validators.required, salonOffsetValidator]
                                         : [salonOffsetValidator]);

        if (linked) {
            this.offsetControl.enable({emitEvent: false});
        } else {
            this.offsetControl.disable({emitEvent: false});
        }

        this.offsetControl.updateValueAndValidity({emitEvent: false});

        this.dateControl.setValidators(linked ? [] : [Validators.required]);
        this.dateControl.updateValueAndValidity({emitEvent: false});

        const fixed = this.form().controls.dueDateFixed;
        fixed.setValidators(linked ? [] : [Validators.required]);
        fixed.updateValueAndValidity({emitEvent: false});
    }

    /** Saisie « J-14 » : met à jour l'offset et la date affichée. */
    private onOffsetInput(value: string): void {
        if (value.trim() === '') {
            this.form().controls.dueDateOffset.setValue(null);

            return;
        }

        const offset = parseSalonOffset(value);
        if (offset === null) {
            return;
        }

        const salonStart = this.salonStart();
        this.form().controls.dueDateOffset.setValue(offset);
        if (salonStart) {
            this.dateControl.setValue(new Date(`${addDays(salonStart, offset)}T00:00:00`), {emitEvent: false});
        }
    }

    /** Choix d'une date : met à jour le J± quand l'échéance est liée au salon. */
    private onDateChange(date: Date | null): void {
        const form = this.form();

        if (!this.linkedControl.value) {
            form.controls.dueDateFixed.setValue(date);

            return;
        }

        const salonStart = this.salonStart();
        const day = toLocalDate(date);
        if (!salonStart || !day) {
            return;
        }

        const offset = offsetFromSalon(day, salonStart);
        this.offsetControl.setValue(formatSalonOffset(offset), {emitEvent: false});
        form.controls.dueDateOffset.setValue(offset);
    }

    /** Bascule « Liée à la date du salon ». */
    private onLinkedChange(linked: boolean): void {
        const form = this.form();
        const salonStart = this.salonStart();
        const date = this.dateControl.value;

        if (linked && salonStart) {
            const day = toLocalDate(date);
            const offset = day ? offsetFromSalon(day, salonStart) : null;

            form.controls.dueDateType.setValue('OFFSET');
            form.controls.dueDateFixed.setValue(null);
            form.controls.dueDateOffset.setValue(offset);
            this.offsetControl.setValue(formatSalonOffset(offset), {emitEvent: false});
            this.applyOffsetState(true);

            return;
        }

        form.controls.dueDateType.setValue('FIXED');
        form.controls.dueDateFixed.setValue(date);
        form.controls.dueDateOffset.setValue(null);
        this.offsetControl.setValue('', {emitEvent: false});
        this.applyOffsetState(false);
    }
}
