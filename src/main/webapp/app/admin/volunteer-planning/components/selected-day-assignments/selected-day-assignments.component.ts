import {CommonModule} from '@angular/common';
import {Component, computed, effect, inject, input, OnDestroy, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';

import {TableModule} from 'primeng/table';
import {ButtonModule} from 'primeng/button';
import {MultiSelectModule} from 'primeng/multiselect';

import {Volunteer} from '../volunteer-planning-model';
import {AssignmentsSlice} from '../volunteer-planning-slices';
import {ButtonBoxComponent} from '../../../../shared/components/button-box/button-box.component';
import {DialogDraftService} from '../../../../shared/services/dialog-draft.service';

@Component({
               selector: 'selected-day-assignments',
               standalone: true,
               imports: [CommonModule, FormsModule, TableModule, ButtonModule, MultiSelectModule, ButtonBoxComponent],
               templateUrl: './selected-day-assignments.component.html'
           })
export class SelectedDayAssignmentsComponent implements OnDestroy {
    private readonly draftService = inject(DialogDraftService);

    data = input.required<AssignmentsSlice>();
    _draft = signal<AssignmentsSlice | null>(null);
    selectedToAssign = signal<string[]>([]);

    constructor() {
        // Register draft service on init and update when data changes
        effect(() => {
            const newData = this.data();
            this._draft.set(structuredClone(newData));
            this.selectedToAssign.set([]);
        });

        this.draftService.registerDraft(() => {
            const d = this._draft();
            return d ? structuredClone(d) : null;
        });
    }

    ngOnDestroy() {
        this.draftService.unregisterDraft();
    }

    assignedVolunteers = computed<Volunteer[]>(() => {
        const d = this._draft();
        if (!d) {
            return [];
        }
        const set = new Set(d.assignedVolunteerIds);
        return d.volunteers.filter(v => set.has(v.id));
    });

    unassignedOptions = computed(() => {
        const d = this._draft();
        if (!d) {
            return [];
        }
        const assigned = new Set(d.assignedVolunteerIds);
        return d.volunteers
                .filter(v => !assigned.has(v.id))
                .map(v => ({label: v.label, value: v.id}));
    });

    assignSelected() {
        const d = this._draft();
        const toAdd = this.selectedToAssign();
        if (!d || toAdd.length === 0) {
            return;
        }

        this.commit(next => {
            const set = new Set(next.assignedVolunteerIds);
            for (const id of toAdd) {
                set.add(id);
            }
            next.assignedVolunteerIds = [...set];
        });

        this.selectedToAssign.set([]);
    }

    unassign(volunteerId: string) {
        this.commit(next => {
            next.assignedVolunteerIds = next.assignedVolunteerIds.filter(id => id !== volunteerId);
        });
    }

    private commit(mutator: (next: AssignmentsSlice) => void) {
        const current = this._draft();
        if (!current) {
            return;
        }
        const next = structuredClone(current);
        mutator(next);
        this._draft.set(next);
    }
}