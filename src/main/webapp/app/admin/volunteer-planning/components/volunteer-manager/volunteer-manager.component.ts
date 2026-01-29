import {CommonModule} from '@angular/common';
import {Component, computed, inject, Input, OnDestroy, OnInit, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';

import {ButtonModule} from 'primeng/button';
import {TableModule} from 'primeng/table';
import {InputTextModule} from 'primeng/inputtext';
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {ConfirmationService} from 'primeng/api';

import {Volunteer} from '../volunteer-planning-model';
import {ButtonBoxComponent} from '../../../../shared/components/button-box/button-box.component';
import {DialogDraftService} from '../../../../shared/services/dialog-draft.service';

@Component({
               selector: 'volunteer-manager',
               standalone: true,
               imports: [CommonModule, FormsModule, ButtonModule, TableModule, InputTextModule, ConfirmDialogModule, ButtonBoxComponent],
               providers: [ConfirmationService],
               templateUrl: './volunteer-manager.component.html'
           })
export class VolunteerManagerComponent implements OnInit, OnDestroy {
    private readonly draftService = inject(DialogDraftService);

    _draft = signal<Volunteer[] | null>(null);
    volunteers = computed(() => this._draft() ?? []);
    private labelDraft = signal<Record<string, string>>({});

    @Input({required: true})
    set data(value: Volunteer[]) {
        this._draft.set(structuredClone(value));
        this.labelDraft.set({});
    }

    ngOnInit() {
        this.draftService.registerDraft(() => {
            const d = this._draft();
            return d ? structuredClone(d) : null;
        });
    }

    ngOnDestroy() {
        this.draftService.unregisterDraft();
    }

    volunteerLabel(v: Volunteer): string {
        return this.labelDraft()[v.id] ?? v.label;
    }

    setVolunteerLabelDraft(volunteerId: string, value: string) {
        this.labelDraft.update(m => ({...m, [volunteerId]: value}));
    }

    commitVolunteerLabel(volunteerId: string) {
        const value = this.labelDraft()[volunteerId];
        if (value === undefined) {
            return;
        }

        const v = value.trim();
        if (!v) {
            return;
        }

        this.commit(next => {
            const found = next.find(x => x.id === volunteerId);
            if (found) {
                found.label = v;
            }
        });

        this.labelDraft.update(m => {
            const copy = {...m};
            delete copy[volunteerId];
            return copy;
        });
    }

    addVolunteer() {
        this.commit(next => next.push({id: this.generateUUID(), label: 'Nouveau bénévole'}));
    }

    deleteVolunteer(volunteerId: string, _label: string) {
        this.commit(next => {
            const idx = next.findIndex(v => v.id === volunteerId);
            if (idx >= 0) {
                next.splice(idx, 1);
            }
        });
    }

    private commit(mutator: (next: Volunteer[]) => void) {
        const current = this._draft();
        if (!current) {
            return;
        }
        const next = structuredClone(current);
        mutator(next);
        this._draft.set(next);
    }

    private generateUUID(): string {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        // Fallback for older browsers
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }
}