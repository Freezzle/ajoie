import {CommonModule} from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, input, model, output, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';

import {TabsModule} from 'primeng/tabs';
import {TableModule} from 'primeng/table';
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {DatePickerModule} from 'primeng/datepicker';
import {SelectModule} from 'primeng/select';
import {MultiSelectModule} from 'primeng/multiselect';
import {ColorPickerModule} from 'primeng/colorpicker';
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {ConfirmationService} from 'primeng/api';

import {
    Category,
    computeTimeSlots,
    Day,
    IntervalMinutes,
    newId,
    normalizeHex,
    normalizeTime,
    Planning
} from '../volunteer-planning-model';

@Component({
               selector: 'volunteer-planning-panel',
               standalone: true,
               imports: [
                   CommonModule,
                   FormsModule,
                   TabsModule,
                   TableModule,
                   ButtonModule,
                   InputTextModule,
                   DatePickerModule,
                   SelectModule,
                   MultiSelectModule,
                   ColorPickerModule,
                   ConfirmDialogModule
               ],
               providers: [ConfirmationService],
               templateUrl: './volunteer-planning-panel.component.html',
               styleUrls: ['./volunteer-planning-panel.component.scss'],
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class VolunteerPlanningPanelComponent {
    intervalOptions: IntervalMinutes[] = [5, 15, 30, 60];
    planning = input.required<Planning>();
    planningChange = output<Planning>();

    topTab = model<number | string>('0');
    planningTab = model<number | string>('0');

    selectedDayId = signal<string | null>(null);
    selectedVolunteerIdsToAssign = signal<string[]>([]);

    iconOptions = [
        {label: 'Shop', value: 'pi pi-shop'},
        {label: 'Credit card', value: 'pi pi-credit-card'},
        {label: 'Sparkles', value: 'pi pi-sparkles'},
        {label: 'Box', value: 'pi pi-box'},
        {label: 'Times', value: 'pi pi-times'},
        {label: 'Calendar', value: 'pi pi-calendar'},
        {label: 'Users', value: 'pi pi-users'},
        {label: 'Wrench', value: 'pi pi-wrench'}
    ];

    dayOptions = computed(() => this.planning().days.map(d => ({label: d.label, value: d.id})));
    volunteerOptions = computed(() => this.planning().volunteers.map(v => ({label: v.label, value: v.id})));

    selectedDay = computed(() => {
        const id = this.selectedDayId();
        if (!id) {
            return null;
        }
        return this.planning().days.find(d => d.id === id) ?? null;
    });

    assignedVolunteers = computed(() => {
        const day = this.selectedDay();
        if (!day) {
            return [];
        }
        const set = new Set(day.assignedVolunteerIds);
        return this.planning().volunteers.filter(v => set.has(v.id));
    });

    unassignedVolunteerOptions = computed(() => {
        const day = this.selectedDay();
        const all = this.planning().volunteers;
        if (!day) {
            return all.map(v => ({label: v.label, value: v.id}));
        }
        const assigned = new Set(day.assignedVolunteerIds);
        return all.filter(v => !assigned.has(v.id)).map(v => ({label: v.label, value: v.id}));
    });

    constructor(private confirm: ConfirmationService) {
    }

    ensureSelectedDay() {
        if (!this.selectedDayId()) {
            this.selectedDayId.set(this.planning().days[0]?.id ?? null);
        }
    }

    // ===================== ADD =====================
    addDay() {
        const cur = this.planning();
        const now = new Date();
        const start = new Date(now);
        start.setHours(8, 0, 0, 0);
        const end = new Date(now);
        end.setHours(19, 0, 0, 0);

        const id = newId('d');
        const newDay: Day = {
            id,
            label: 'Nouveau jour',
            startTime: start,
            endTime: end,
            assignedVolunteerIds: [],
            cells: []
        };

        this.planningChange.emit({...cur, days: [...cur.days, newDay]});
        this.selectedDayId.set(id);
    }

    addVolunteer() {
        const cur = this.planning();
        const id = newId('v');
        this.planningChange.emit({...cur, volunteers: [...cur.volunteers, {id, label: 'Nouveau bénévole'}]});
    }

    addCategory() {
        const cur = this.planning();
        const id = newId('c');
        const newCat: Category = {id, label: 'Nouvelle catégorie', icon: 'pi pi-box', color: '#ffe8b5'};
        this.planningChange.emit({...cur, categories: [...cur.categories, newCat]});
    }

    // ===================== UPDATE DAYS (inline) =====================
    updateDayLabel(dayId: string, labelRaw: string) {
        const label = (labelRaw ?? '').trim();
        const cur = this.planning();
        const idx = cur.days.findIndex(d => d.id === dayId);
        if (idx < 0) {
            return;
        }
        if (cur.days[idx].label === label) {
            return;
        }

        const days = [...cur.days];
        days[idx] = {...days[idx], label};
        this.planningChange.emit({...cur, days});
    }

    updateDayTimes(dayId: string, startTime: Date, endTime: Date) {
        const cur = this.planning();
        const idx = cur.days.findIndex(d => d.id === dayId);
        if (idx < 0) {
            return;
        }

        const s = normalizeTime(startTime);
        const e = normalizeTime(endTime);
        if (e.getTime() <= s.getTime()) {
            return;
        }

        const d = cur.days[idx];
        if (d.startTime.getTime() === s.getTime() && d.endTime.getTime() === e.getTime()) {
            return;
        }

        const days = [...cur.days];
        days[idx] = {...d, startTime: s, endTime: e};
        this.planningChange.emit({...cur, days});
    }

    confirmDeleteDay(dayId: string, label: string) {
        this.confirm.confirm({
                                 message: `Supprimer le jour "${label}" ?`,
                                 accept: () => {
                                     const cur = this.planning();
                                     const days = cur.days.filter(d => d.id !== dayId);
                                     this.planningChange.emit({...cur, days});

                                     if (this.selectedDayId() === dayId) {
                                         this.selectedDayId.set(days[0]?.id ?? null);
                                     }
                                 }
                             });
    }

    // ===================== UPDATE VOLUNTEERS (inline) =====================
    updateVolunteerLabel(volunteerId: string, labelRaw: string) {
        const label = (labelRaw ?? '').trim();
        const cur = this.planning();
        const idx = cur.volunteers.findIndex(v => v.id === volunteerId);
        if (idx < 0) {
            return;
        }
        if (cur.volunteers[idx].label === label) {
            return;
        }

        const volunteers = [...cur.volunteers];
        volunteers[idx] = {...volunteers[idx], label};
        this.planningChange.emit({...cur, volunteers});
    }

    confirmDeleteVolunteer(volunteerId: string, label: string) {
        this.confirm.confirm({
                                 message: `Supprimer le bénévole "${label}" ?\n\nSes affectations et ses cellules seront aussi supprimées.`,
                                 accept: () => {
                                     const cur = this.planning();

                                     const volunteers = cur.volunteers.filter(v => v.id !== volunteerId);

                                     const days = cur.days.map(d => ({
                                         ...d,
                                         assignedVolunteerIds: d.assignedVolunteerIds.filter(id => id !== volunteerId),
                                         cells: d.cells.filter(c => c.volunteerId !== volunteerId)
                                     }));

                                     this.planningChange.emit({...cur, volunteers, days});
                                 }
                             });
    }

    // ===================== ASSIGN / UNASSIGN =====================
    assignSelectedVolunteers() {
        const day = this.selectedDay();
        const toAdd = this.selectedVolunteerIdsToAssign();
        if (!day || toAdd.length === 0) {
            return;
        }

        const cur = this.planning();
        const idx = cur.days.findIndex(d => d.id === day.id);
        if (idx < 0) {
            return;
        }

        const days = [...cur.days];
        const d = days[idx];

        const set = new Set(d.assignedVolunteerIds);
        for (const id of toAdd) {
            set.add(id);
        }

        days[idx] = {...d, assignedVolunteerIds: [...set]};
        this.planningChange.emit({...cur, days});

        this.selectedVolunteerIdsToAssign.set([]);
    }

    unassignVolunteer(dayId: string, volunteerId: string) {
        const cur = this.planning();
        const idx = cur.days.findIndex(d => d.id === dayId);
        if (idx < 0) {
            return;
        }

        const days = [...cur.days];
        const d = days[idx];

        days[idx] = {
            ...d,
            assignedVolunteerIds: d.assignedVolunteerIds.filter(id => id !== volunteerId),
            cells: d.cells.filter(c => c.volunteerId !== volunteerId)
        };

        this.planningChange.emit({...cur, days});
    }

    // ===================== UPDATE CATEGORIES (inline) =====================
    updateCategoryLabel(categoryId: string, labelRaw: string) {
        const label = (labelRaw ?? '').trim();
        const cur = this.planning();
        const idx = cur.categories.findIndex(c => c.id === categoryId);
        if (idx < 0) {
            return;
        }
        if (cur.categories[idx].label === label) {
            return;
        }

        const categories = [...cur.categories];
        categories[idx] = {...categories[idx], label};
        this.planningChange.emit({...cur, categories});
    }

    updateCategoryIcon(categoryId: string, icon: string) {
        const cur = this.planning();
        const idx = cur.categories.findIndex(c => c.id === categoryId);
        if (idx < 0) {
            return;
        }
        if (cur.categories[idx].icon === icon) {
            return;
        }

        const categories = [...cur.categories];
        categories[idx] = {...categories[idx], icon};
        this.planningChange.emit({...cur, categories});
    }

    // ---------- Controls ----------
    onIntervalChange(interval: IntervalMinutes) {
        const cur = this.planning();

        const days = cur.days.map(d => {
            const slotsCount = computeTimeSlots(d.startTime, d.endTime, interval).length;
            return {
                ...d,
                cells: d.cells.filter(c => c.slotIndex >= 0 && c.slotIndex < slotsCount)
            };
        });

        this.planningChange.emit({...cur, intervalMinutes: interval, days});
    }

    updateCategoryColor(categoryId: string, colorRaw: string) {
        const color = normalizeHex(colorRaw);
        if (!color) {
            return;
        }

        const cur = this.planning();
        const idx = cur.categories.findIndex(c => c.id === categoryId);
        if (idx < 0) {
            return;
        }
        if (cur.categories[idx].color === color) {
            return;
        }

        const categories = [...cur.categories];
        categories[idx] = {...categories[idx], color};
        this.planningChange.emit({...cur, categories});
    }

    confirmDeleteCategory(categoryId: string, label: string) {
        this.confirm.confirm({
                                 message: `Supprimer la catégorie "${label}" ?\n\nLes cellules qui l'utilisent seront nettoyées.`,
                                 accept: () => {
                                     const cur = this.planning();

                                     const categories = cur.categories.filter(c => c.id !== categoryId);

                                     const days = cur.days.map(d => ({
                                         ...d,
                                         cells: d.cells.filter(cell => cell.categoryId !== categoryId),
                                     }));

                                     this.planningChange.emit({...cur, categories, days});
                                 },
                             });
    }
}