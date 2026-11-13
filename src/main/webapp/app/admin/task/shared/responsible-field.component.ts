import {ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, inject, input} from '@angular/core';
import {ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule} from '@angular/forms';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';

import {AutocompleteBoxComponent} from '../../../shared/components/autocomplete-box/autocomplete-box.component';
import {ResponsibleAvatarComponent} from './responsible-avatar.component';

/**
 * Champ « Responsable » : on choisit un nom déjà connu du salon ou on en saisit un
 * nouveau. La valeur est une chaîne libre ; `null` signifie « responsable de la
 * tâche parente ».
 */
@Component({
               selector: 'responsible-field',
               imports: [
                   FormsModule,
                   ReactiveFormsModule,
                   TranslatePipe,
                   AutocompleteBoxComponent,
                   ResponsibleAvatarComponent
               ],
               template: `
                   <autocomplete-box [fieldName]="fieldName()"
                                     [ngModel]="value"
                                     [optionTemplate]="option"
                                     [placeholder]="placeholder()"
                                     [suggestions]="known()"
                                     [translateKey]="translateKey() ?? ''"
                                     (ngModelChange)="emit($event)"/>

                   <ng-template #option let-name>
                       <span class="rf-option">
                           <responsible-avatar [known]="known()" [responsible]="name"/>
                           <span class="rf-name">{{ name }}</span>
                       </span>
                   </ng-template>

                   @if (showAddHint()) {
                       <small class="rf-add">{{ 'task.quickAdd.addResponsible' | translate: {name: value} }}</small>
                   }
               `,
               styles: [`
                   :host {
                       display: block;
                   }

                   .rf-option {
                       display: inline-flex;
                       align-items: center;
                       gap: .5rem;
                   }

                   .rf-name {
                       min-width: 0;
                       overflow: hidden;
                       text-overflow: ellipsis;
                       white-space: nowrap;
                   }

                   .rf-add {
                       display: block;
                       margin-top: 2px;
                       font-size: 11.5px;
                       color: var(--app-primary);
                   }
               `],
               providers: [{
                   provide: NG_VALUE_ACCESSOR,
                   useExisting: forwardRef(() => ResponsibleFieldComponent),
                   multi: true
               }],
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class ResponsibleFieldComponent implements ControlValueAccessor {
    readonly fieldName = input<string>('responsible');
    readonly translateKey = input<string | null>('task.dialog.responsible');
    /** Responsables déjà utilisés dans le salon, proposés en premier. */
    readonly known = input<string[]>([]);
    /** Responsable de la tâche parente, affiché en indication quand le champ est vide. */
    readonly inheritedFrom = input<string | null>(null);

    private readonly translateService = inject(TranslateService);
    private readonly changeDetectorRef = inject(ChangeDetectorRef);

    value: string | null = null;

    private onChange: (value: string | null) => void = () => undefined;
    private onTouched: () => void = () => undefined;

    /** Vide : on rappelle de qui la sous-tâche héritera. */
    placeholder(): string {
        const inherited = this.inheritedFrom();

        return inherited
               ? this.translateService.instant('task.quickAdd.responsibleInherited', {name: inherited}) as string
               : this.translateService.instant('task.quickAdd.responsibleNone') as string;
    }

    /** Vrai quand la saisie ne correspond à aucun nom connu : on l'ajoutera tel quel. */
    showAddHint(): boolean {
        const value = this.value?.trim();

        return !!value && !this.known().some(name => name.toLowerCase() === value.toLowerCase());
    }

    writeValue(value: string | null): void {
        this.value = value;
        this.changeDetectorRef.markForCheck();
    }

    registerOnChange(fn: (value: string | null) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    emit(value: string | null): void {
        this.value = value;
        this.onChange(value);
        this.onTouched();
    }
}
