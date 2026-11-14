import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {Observable, startWith, switchMap} from 'rxjs';

import {CheckboxBoxComponent} from '../../../shared/components/checkbox-box/checkbox-box.component';
import {NumberBoxComponent} from '../../../shared/components/number-box/number-box.component';
import {SelectBoxComponent} from '../../../shared/components/select-box/select-box.component';
import {RepeatUnit} from '../model/task-instance.interface';
import {MAX_REPEAT_COUNT} from '../service/subtask-instance-form.service';

/** Sous-ensemble du formulaire piloté par ce champ. */
export interface RepeatControls {
    repeatEnabled: FormControl<boolean>;
    repeatCount: FormControl<number | null>;
    repeatUnit: FormControl<RepeatUnit>;
}

interface RepeatValue {
    repeatEnabled?: boolean;
    repeatCount?: number | null;
    repeatUnit?: RepeatUnit;
}

/** Valeur initiale avant la première émission du formulaire. */
const EMPTY_REPEAT: RepeatValue = {};

/**
 * Répétition d'une sous-tâche à la création : N occurrences espacées d'un jour,
 * d'une semaine ou d'un mois. Les occurrences créées sont indépendantes les unes
 * des autres, aucun lien n'est conservé avec la première.
 */
@Component({
               selector: 'repeat-field',
               imports: [
                   FormsModule,
                   ReactiveFormsModule,
                   TranslatePipe,
                   CheckboxBoxComponent,
                   NumberBoxComponent,
                   SelectBoxComponent
               ],
               templateUrl: './repeat-field.component.html',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class RepeatFieldComponent {
    readonly form = input.required<FormGroup<RepeatControls>>();

    private readonly translateService = inject(TranslateService);

    readonly maxCount = MAX_REPEAT_COUNT;

    /** Valeurs du formulaire, suivies même lorsque le groupe est remplacé. */
    private readonly value = toSignal(
        toObservable(this.form).pipe(
            switchMap((form): Observable<RepeatValue> => form.valueChanges.pipe(startWith(form.getRawValue())))
        ),
        {initialValue: EMPTY_REPEAT}
    );

    readonly unitOptions: RepeatUnit[] = ['DAY', 'WEEK', 'MONTH'];

    /** Libellé traduit d'un intervalle, pour la liste déroulante. */
    readonly unitLabel = (unit: RepeatUnit | null): string =>
        unit ? this.text(`task.repeat.unit${capitalize(unit)}`) : '';

    readonly enabled = computed(() => this.value().repeatEnabled === true);

    /** Phrase explicite du nombre d'occurrences créées, nulle si la saisie est incomplète. */
    readonly summary = computed(() => {
        const {repeatEnabled, repeatCount, repeatUnit} = this.value();
        if (!repeatEnabled || repeatCount == null || repeatCount < 2 || !repeatUnit) {
            return null;
        }

        return this.text(`task.repeat.summary${capitalize(repeatUnit)}`, {count: repeatCount});
    });

    private text(key: string, params?: object): string {
        return this.translateService.instant(key, params) as string;
    }
}

function capitalize(unit: RepeatUnit): string {
    return unit.charAt(0) + unit.slice(1).toLowerCase();
}
