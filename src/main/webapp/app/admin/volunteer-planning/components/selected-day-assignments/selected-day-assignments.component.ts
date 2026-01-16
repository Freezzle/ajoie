import { CommonModule } from '@angular/common';
import { Component, computed, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { MultiSelectModule } from 'primeng/multiselect';

import { Volunteer } from '../volunteer-planning-model';
import { AssignmentsSlice } from '../volunteer-planning-slices';
import {DatePicker} from 'primeng/datepicker';
import {ButtonBoxComponent} from '../../../../shared/components/button-box/button-box.component';

@Component({
               selector: 'selected-day-assignments',
               standalone: true,
               imports: [CommonModule, FormsModule, TableModule, ButtonModule, MultiSelectModule, DatePicker, ButtonBoxComponent],
               templateUrl: './selected-day-assignments.component.html'
           })
export class SelectedDayAssignmentsComponent {
    _draft = signal<AssignmentsSlice | null>(null);

    @Output() confirmDraft = new EventEmitter<AssignmentsSlice>();
    @Output() cancelDraft = new EventEmitter<void>();

    // multi select state
    selectedToAssign = signal<string[]>([]);

    @Input({ required: true })
    set data(value: AssignmentsSlice) {
        this._draft.set(structuredClone(value));
        this.selectedToAssign.set([]);
    }

    dayLabel = computed(() => this._draft()?.dayLabel ?? 'Jour');

    assignedVolunteers = computed<Volunteer[]>(() => {
        const d = this._draft();
        if (!d) return [];
        const set = new Set(d.assignedVolunteerIds);
        return d.volunteers.filter(v => set.has(v.id));
    });

    unassignedOptions = computed(() => {
        const d = this._draft();
        if (!d) return [];
        const assigned = new Set(d.assignedVolunteerIds);
        return d.volunteers
                .filter(v => !assigned.has(v.id))
                .map(v => ({ label: v.label, value: v.id }));
    });

    assignSelected() {
        const d = this._draft();
        const toAdd = this.selectedToAssign();
        if (!d || toAdd.length === 0) return;

        this.commit(next => {
            const set = new Set(next.assignedVolunteerIds);
            for (const id of toAdd) set.add(id);
            next.assignedVolunteerIds = [...set];
        });

        this.selectedToAssign.set([]);
    }

    unassign(volunteerId: string) {
        this.commit(next => {
            next.assignedVolunteerIds = next.assignedVolunteerIds.filter(id => id !== volunteerId);
        });
    }

    confirm() {
        const d = this._draft();
        if (!d) return;
        this.confirmDraft.emit(structuredClone(d));
    }

    cancel() {
        this.cancelDraft.emit();
    }

    private commit(mutator: (next: AssignmentsSlice) => void) {
        const current = this._draft();
        if (!current) return;
        const next = structuredClone(current);
        mutator(next);
        this._draft.set(next);
    }
}