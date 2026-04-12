import {Component, inject, Input, OnDestroy, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';
import SharedModule from 'app/shared/shared.module';
import {DialogDraftService} from '../../../shared/services/dialog-draft.service';
import {SalonService} from '../../salon/service/salon.service';
import {ISalon} from '../../salon/model/salon.interface';
import {Select} from 'primeng/select';
import {IftaLabel} from 'primeng/iftalabel';

@Component({
    selector: 'app-copy-tasks-dialog',
    imports: [
        CommonModule,
        FormsModule,
        SharedModule,
        TranslateModule,
        Select,
        IftaLabel
    ],
    template: `
        <p-iftalabel>
            <p-select [options]="salons()"
                      [(ngModel)]="selectedSalonId"
                      optionLabel="_displayLabel"
                      optionValue="id"
                      [filter]="true"
                      filterBy="_displayLabel"
                      [placeholder]="'task.actions.copyDialog.selectPlaceholder' | translate"
                      [style]="{'width': '100%'}"
                      appendTo="body"
                      inputId="salonSelect"/>
            <label for="salonSelect" jhiTranslate="task.actions.copyDialog.selectLabel">Salon source</label>
        </p-iftalabel>
    `
})
export class CopyTasksDialogComponent implements OnInit, OnDestroy {
    private readonly salonService = inject(SalonService);
    private readonly draftService = inject(DialogDraftService);

    /** Salon courant à exclure de la liste */
    @Input() currentSalonId: string | null = null;

    salons = signal<(ISalon & { _displayLabel: string })[]>([]);
    selectedSalonId: string | null = null;

    ngOnInit(): void {
        this.draftService.registerDraft(() => this.selectedSalonId);

        this.salonService.query().subscribe(res => {
            const all = (res.body ?? [])
                .filter(s => s.id !== this.currentSalonId)
                .map(s => ({
                    ...s,
                    _displayLabel: `${s.place} — ${new Date(s.startingDate).toLocaleDateString('fr-CH')}`
                }))
                .sort((a, b) => new Date(b.startingDate).getTime() - new Date(a.startingDate).getTime());
            this.salons.set(all);
        });
    }

    ngOnDestroy(): void {
        this.draftService.unregisterDraft();
    }
}
