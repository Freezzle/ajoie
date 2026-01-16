import {CommonModule} from '@angular/common';
import {Component, computed, EventEmitter, Input, Output, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';

import {ButtonModule} from 'primeng/button';
import {TableModule} from 'primeng/table';
import {InputTextModule} from 'primeng/inputtext';
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {ConfirmationService} from 'primeng/api';

import {newId, Volunteer} from '../volunteer-planning-model';
import {ButtonBoxComponent} from '../../../../shared/components/button-box/button-box.component';

@Component({
               selector: 'volunteer-manager',
               standalone: true,
               imports: [CommonModule, FormsModule, ButtonModule, TableModule, InputTextModule, ConfirmDialogModule, ButtonBoxComponent],
               providers: [ConfirmationService],
               templateUrl: './volunteer-manager.component.html'
           })
export class VolunteerManagerComponent {
    _draft = signal<Volunteer[] | null>(null);

    @Output() confirmDraft = new EventEmitter<Volunteer[]>();

    volunteers = computed(() => this._draft() ?? []);

    // Drafts de saisie (comme ton pattern rooms)
    private labelDraft = signal<Record<string, string>>({});

    @Input({required: true})
    set data(value: Volunteer[]) {
        this._draft.set(structuredClone(value));
        this.labelDraft.set({});
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
        this.commit(next => next.push({id: newId('v'), label: 'Nouveau bénévole'}));
    }

    deleteVolunteer(volunteerId: string, label: string) {
        this.commit(next => {
            const idx = next.findIndex(v => v.id === volunteerId);
            if (idx >= 0) {
                next.splice(idx, 1);
            }
        });
    }

    confirm() {
        const d = this._draft();
        if (!d) {
            return;
        }
        this.confirmDraft.emit(structuredClone(d));
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
}