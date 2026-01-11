import {CommonModule} from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, HostListener, model, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';

import {TableModule} from 'primeng/table';
import {ButtonModule} from 'primeng/button';
import {DividerModule} from 'primeng/divider';
import {DatePickerModule} from 'primeng/datepicker';
import {SelectModule} from 'primeng/select';
import {DialogModule} from 'primeng/dialog';
import {ConfirmPopup} from 'primeng/confirmpopup';
import {Toast} from 'primeng/toast';

import {ContentPageComponent} from '../../../shared/components/content-page/content-page.component';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {AlertComponent} from '../../../shared/alert/alert.component';
import {AlertErrorComponent} from '../../../shared/alert/alert-error.component';
import {CardComponent} from '../../../shared/components/card/card.component';
import {TranslateModule} from '@ngx-translate/core';

import {Category, computeTimeSlots, Day, Planning, TimeSlot, Tool, Volunteer} from './volunteer-planning-model';

import {VolunteerPlanningPanelComponent} from './volunteer-planning-panel/volunteer-planning-panel.component';
import {Tab, TabList, TabPanels, Tabs} from "primeng/tabs";
import {DialogBoxComponent} from "../../../shared/components/dialog-box/dialog-box.component";

@Component({
    selector: 'app-volunteer-planning',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        DividerModule,
        DatePickerModule,
        SelectModule,
        DialogModule,
        ConfirmPopup,
        Toast,
        ContentPageComponent,
        TranslateModule,
        ButtonBoxComponent,
        AlertComponent,
        AlertErrorComponent,
        CardComponent,
        VolunteerPlanningPanelComponent,
        TabPanels,
        TabList,
        Tabs,
        Tab,
        DialogBoxComponent,
    ],
    templateUrl: './volunteer-planning.component.html',
    styleUrls: ['./volunteer-planning.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VolunteerPlanningComponent {
    planning = signal<Planning>(this.makeInitialPlanning());

    selectedDayId = signal<string>(this.planning().days[0].id);

    // ✅ Nouveau : tool = categoryId, plus TaskCategory
    selectedTool = signal<Tool>({kind: 'ERASER'});

    painting = signal(false);
    private lastKey: string | null = null;

    // ✅ Dialog pour ton panel (admin)
    panelVisible = model(false);

    // perf: rAF throttle optionnel
    private rafId: number | null = null;
    private pendingPaint: { vId: string; slot: number } | null = null;

    // ---------- computed ----------
    dayOptions = computed(() => this.planning().days.map(d => ({id: d.id, label: d.label})));

    selectedDay = computed(() => {
        const id = this.selectedDayId();
        return this.planning().days.find(d => d.id === id) ?? null;
    });

    timeSlots = computed<TimeSlot[]>(() => {
        const day = this.selectedDay();
        if (!day) return [];
        return computeTimeSlots(day.startTime, day.endTime, this.planning().intervalMinutes);
    });

    // ✅ map categories by id
    categoryMap = computed(() => new Map(this.planning().categories.map(c => [c.id, c])));

    // ✅ cellMap: key => categoryId
    cellMap = computed(() => {
        const day = this.selectedDay();
        const m = new Map<string, string>();
        if (!day) return m;
        for (const c of day.cells) m.set(this.cellKey(c.volunteerId, c.slotIndex), c.categoryId);
        return m;
    });

    // ✅ volunteers visibles : si le jour a des assignations, on filtre
    visibleVolunteers = computed<Volunteer[]>(() => {
        const day = this.selectedDay();
        const all = this.planning().volunteers;
        if (!day) return all;

        const assigned = day.assignedVolunteerIds ?? [];
        if (assigned.length === 0) return all; // choix: si aucun assigné, afficher tous
        const set = new Set(assigned);
        return all.filter(v => set.has(v.id));
    });

    // ---------- Panel (admin) ----------
    openPanel() {
        this.panelVisible.set(true);
    }

    onPlanningChange(next: Planning) {
        this.planning.set(next);

        // si jour supprimé => fallback
        const selected = this.selectedDayId();
        if (!next.days.some(d => d.id === selected)) {
            this.selectedDayId.set(next.days[0]?.id ?? selected);
        }

        // si catégorie sélectionnée supprimée => gomme
        const t = this.selectedTool();
        if (t.kind === 'CATEGORY' && !next.categories.some(c => c.id === t.categoryId)) {
            this.selectedTool.set({kind: 'ERASER'});
        }
    }

    // ---------- Palette ----------
    selectEraser() {
        this.selectedTool.set({kind: 'ERASER'});
    }

    selectCategory(categoryId: string) {
        this.selectedTool.set({kind: 'CATEGORY', categoryId});
    }

    isSelectedCategory(categoryId: string) {
        const t = this.selectedTool();
        return t.kind === 'CATEGORY' && t.categoryId === categoryId;
    }

    // ---------- Grid paint ----------
    getCategoryId(volunteerId: string, slotIndex: number): string | null {
        return this.cellMap().get(this.cellKey(volunteerId, slotIndex)) ?? null;
    }

    uiFor(categoryId: string | null): Category | null {
        if (!categoryId) return null;
        return this.categoryMap().get(categoryId) ?? null;
    }

    startPaint(volunteerId: string, slotIndex: number, ev: PointerEvent): void {
        if (ev.pointerType === 'mouse' && ev.button !== 0) return;

        this.painting.set(true);
        this.lastKey = `${volunteerId}-${slotIndex}`;

        // applique tout de suite
        this.applyTool(volunteerId, slotIndex);

        // capture seulement touch/pen
        if (ev.pointerType !== 'mouse') {
            const target = ev.currentTarget as HTMLElement | null;
            if (target?.setPointerCapture) {
                try {
                    target.setPointerCapture(ev.pointerId);
                } catch {
                }
            }
        }

        ev.preventDefault();
    }

    onPaintMove(ev: PointerEvent): void {
        if (!this.painting()) return;

        // strict: uniquement si bouton gauche appuyé
        if (ev.pointerType === 'mouse' && (ev.buttons & 1) === 0) {
            this.stopPaint();
            return;
        }

        const el = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null;
        const cell = el?.closest('.paint-cell') as HTMLElement | null;
        if (!cell) return;

        const vIdStr = cell.dataset['volunteerId'];
        const slotStr = cell.dataset['slotIndex'];
        if (vIdStr == null || slotStr == null) return;

        const key = `${vIdStr}-${slotStr}`;
        if (key === this.lastKey) return;
        this.lastKey = key;

        // ✅ throttle (optionnel mais recommandé)
        this.queuePaint(vIdStr, Number(slotStr));
    }

    stopPaint(): void {
        this.painting.set(false);
        this.lastKey = null;

        // cancel throttle
        this.pendingPaint = null;
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    applyTool(volunteerId: string, slotIndex: number) {
        const day = this.selectedDay();
        if (!day) return;

        const tool = this.selectedTool();
        const categoryId: string | null = tool.kind === 'ERASER' ? null : tool.categoryId;

        this.setCellCategory(day.id, volunteerId, slotIndex, categoryId);
    }

    // ✅ update minimal-copy (perf)
    private setCellCategory(dayId: string, volunteerId: string, slotIndex: number, categoryId: string | null) {
        const cur = this.planning();
        const dayIndex = cur.days.findIndex(d => d.id === dayId);
        if (dayIndex < 0) return;

        const day = cur.days[dayIndex];
        const i = day.cells.findIndex(c => c.volunteerId === volunteerId && c.slotIndex === slotIndex);

        // no-op
        if (categoryId === null && i < 0) return;
        if (categoryId !== null && i >= 0 && day.cells[i].categoryId === categoryId) return;

        const days = [...cur.days];
        const nextDay: Day = {...day};

        const cells = [...day.cells];
        if (categoryId === null) {
            cells.splice(i, 1);
        } else {
            if (i >= 0) cells[i] = {...cells[i], categoryId};
            else cells.push({volunteerId, slotIndex, categoryId});
        }

        nextDay.cells = cells;
        days[dayIndex] = nextDay;

        this.planning.set({...cur, days});
    }

    private queuePaint(vId: string, slot: number) {
        this.pendingPaint = {vId, slot};
        if (this.rafId !== null) return;

        this.rafId = requestAnimationFrame(() => {
            this.rafId = null;
            const p = this.pendingPaint;
            this.pendingPaint = null;
            if (!p) return;
            this.applyTool(p.vId, p.slot);
        });
    }

    // ---------- Helpers ----------
    private cellKey(volunteerId: string, slotIndex: number): string {
        return `${volunteerId}::${slotIndex}`;
    }

    private timeAt(h: number, m: number): Date {
        const d = new Date();
        d.setHours(h, m, 0, 0);
        return d;
    }

    @HostListener('window:pointerup')
    @HostListener('window:pointercancel')
    @HostListener('window:blur')
    onGlobalStop(): void {
        this.stopPaint();
    }

    private makeInitialPlanning(): Planning {
        const volunteers: Volunteer[] = [
            {id: 'v1', label: 'Charlène'},
            {id: 'v2', label: 'Davy'},
            {id: 'v3', label: 'Dylan'},
            {id: 'v4', label: 'Matthias'},
            {id: 'v5', label: 'Raphael'},
            {id: 'v6', label: 'Kevin'},
            {id: 'v7', label: 'Cathy'},
            {id: 'v8', label: 'Leila'},
            {id: 'v9', label: 'Michael'},
            {id: 'v10', label: 'Papa'},
        ];

        const categories: Category[] = [
            {id: 'c1', label: 'Buvette', icon: 'pi pi-credit-card', color: '#C1E1C1'},
            {id: 'c2', label: 'Lavage', icon: 'pi pi-sparkles', color: '#C1D9E1'},
            {id: 'c3', label: 'Cuisine', icon: 'pi pi-shop', color: '#FFDDC1'},
            {id: 'c4', label: 'Logistique', icon: 'pi pi-box', color: '#ffe8b5'},
            {id: 'c5', label: 'Non disponible', icon: 'pi pi-times', color: '#DDDDDD'},
        ];

        return {
            intervalMinutes: 60,
            volunteers,
            categories,
            days: [
                {
                    id: 'd1',
                    label: 'Vendredi',
                    startTime: this.timeAt(8, 0),
                    endTime: this.timeAt(19, 0),
                    assignedVolunteerIds: volunteers.map(v => v.id), // par défaut assignés
                    cells: [],
                },
                {
                    id: 'd2',
                    label: 'Samedi',
                    startTime: this.timeAt(8, 0),
                    endTime: this.timeAt(19, 0),
                    assignedVolunteerIds: volunteers.map(v => v.id),
                    cells: [],
                },
            ],
        };
    }
}