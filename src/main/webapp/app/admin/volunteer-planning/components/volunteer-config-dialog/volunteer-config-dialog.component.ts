import {ChangeDetectionStrategy, Component, computed, inject, Input, OnDestroy, OnInit, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';

import {TableModule} from 'primeng/table';
import {InputTextModule} from 'primeng/inputtext';
import {TextareaModule} from 'primeng/textarea';
import {SelectModule} from 'primeng/select';
import {DatePickerModule} from 'primeng/datepicker';
import {ColorPickerModule} from 'primeng/colorpicker';
import {MultiSelectModule} from 'primeng/multiselect';
import {MessageService} from 'primeng/api';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';

import {ButtonBoxComponent} from '../../../../shared/components/button-box/button-box.component';
import {AppTab, TabPanelDirective, TabsComponent} from '../../../../shared/components/tabs';
import {DialogDraftService} from '../../../../shared/services/dialog-draft.service';

import {Category, Day, IntervalMinutes, newId, normalizeHex, normalizeTime, Planning, Volunteer} from '../volunteer-planning-model';

/**
 * Dialogue de configuration unique du planning des bénévoles (calqué sur talks-config-dialog).
 * Formulaire réparti sur trois onglets :
 *  - « Catégories » : gestion des catégories (icône / couleur / libellé / description) ;
 *  - « Jours » : jours (horaires / intervalle / date / description) ;
 *  - « Bénévoles et rattachement » : bénévoles + attribution des bénévoles par jour.
 * Travaille sur un brouillon complet du Planning et expose ce brouillon via DialogDraftService.
 */
@Component({
               selector: 'volunteer-config-dialog',
               standalone: true,
               imports: [
                   FormsModule,
                   TranslatePipe,
                   TableModule,
                   InputTextModule,
                   TextareaModule,
                   SelectModule,
                   DatePickerModule,
                   ColorPickerModule,
                   MultiSelectModule,
                   ButtonBoxComponent,
                   TabsComponent,
                   TabPanelDirective
               ],
               templateUrl: './volunteer-config-dialog.component.html',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class VolunteerConfigDialogComponent implements OnInit, OnDestroy {
    private readonly draftService = inject(DialogDraftService);
    private readonly translate = inject(TranslateService);
    private readonly messageService = inject(MessageService);

    private readonly TIME_REF = new Date(2000, 0, 1, 0, 0, 0, 0);

    readonly intervalValues: IntervalMinutes[] = [5, 15, 30, 60];
    readonly intervalOptions = computed<{ label: string; value: IntervalMinutes }[]>(() =>
        this.intervalValues.map(v => ({
            label: this.translate.instant(`planningVolunteers.interval.${v}`),
            value: v
        }))
    );

    readonly iconOptions = [
        {label: 'Aucune', value: ''},
        {label: 'Shop', value: 'pi pi-shop'},
        {label: 'Credit card', value: 'pi pi-credit-card'},
        {label: 'Sparkles', value: 'pi pi-sparkles'},
        {label: 'Box', value: 'pi pi-box'},
        {label: 'Times', value: 'pi pi-times'},
        {label: 'Calendar', value: 'pi pi-calendar'},
        {label: 'Users', value: 'pi pi-users'},
        {label: 'Wrench', value: 'pi pi-wrench'}
    ];

    private readonly _draft = signal<Planning | null>(null);

    readonly volunteers = computed<Volunteer[]>(() => this._draft()?.volunteers ?? []);
    readonly categories = computed<Category[]>(() => this._draft()?.categories ?? []);
    readonly days = computed<Day[]>(() => this._draft()?.days ?? []);

    readonly volunteerOptions = computed(() => this.volunteers().map(v => ({label: v.label, value: v.id})));

    // Onglets de configuration : catégories, jours, puis bénévoles/rattachement.
    readonly configTabs: AppTab[] = [
        {key: 'categories', labelKey: 'planningVolunteers.config.tabCategories'},
        {key: 'days', labelKey: 'planningVolunteers.config.tabDays'},
        {key: 'volunteers', labelKey: 'planningVolunteers.config.tabVolunteers'}
    ];
    readonly activeTab = signal<string>('categories');

    // Brouillons de saisie texte (évitent de recréer l'objet à chaque frappe, cf. enfants d'origine).
    private readonly textDrafts = signal<Record<string, string>>({});
    // Références Date stables pour le p-datepicker de la date publique de chaque jour.
    private readonly dateModels = signal<Record<string, Date | null>>({});

    @Input({required: true})
    set data(value: Planning) {
        this._draft.set(structuredClone(value));
        this.textDrafts.set({});
        const dates: Record<string, Date | null> = {};
        for (const day of value.days) {
            dates[day.id] = this.parseIsoDate(day.date ?? null);
        }
        this.dateModels.set(dates);
    }

    ngOnInit(): void {
        this.draftService.registerDraft(() => {
            const d = this._draft();
            return d ? structuredClone(d) : null;
        });
        this.draftService.registerValidate(() => this.validate());
    }

    ngOnDestroy(): void {
        this.draftService.unregisterDraft();
    }

    // ---------- bénévoles ----------

    addVolunteer(): void {
        this.commit(p => p.volunteers.push({id: newId('v'), label: 'Nouveau bénévole'}));
    }

    volunteerLabel(v: Volunteer): string {
        return this.textDrafts()[this.key('v', v.id)] ?? v.label;
    }

    setVolunteerLabelDraft(id: string, value: string): void {
        this.setTextDraft(this.key('v', id), value);
    }

    commitVolunteerLabel(id: string): void {
        const value = this.takeTextDraft(this.key('v', id));
        if (value === undefined) {
            return;
        }
        const label = value.trim();
        if (!label) {
            return;
        }
        this.commit(p => {
            const found = p.volunteers.find(x => x.id === id);
            if (found) {
                found.label = label;
            }
        });
    }

    deleteVolunteer(id: string): void {
        this.commit(p => {
            p.volunteers = p.volunteers.filter(v => v.id !== id);
            for (const day of p.days) {
                day.assignedVolunteerIds = (day.assignedVolunteerIds ?? []).filter(x => x !== id);
            }
        });
    }

    // ---------- catégories ----------

    addCategory(): void {
        this.commit(p => p.categories.push({id: newId('c'), label: 'Nouvelle catégorie', color: '#ffe8b5'}));
    }

    categoryLabel(c: Category): string {
        return this.textDrafts()[this.key('cl', c.id)] ?? c.label;
    }

    setCategoryLabelDraft(id: string, value: string): void {
        this.setTextDraft(this.key('cl', id), value);
    }

    commitCategoryLabel(id: string): void {
        const value = this.takeTextDraft(this.key('cl', id));
        if (value === undefined) {
            return;
        }
        const label = value.trim();
        if (!label) {
            return;
        }
        this.commit(p => {
            const found = p.categories.find(x => x.id === id);
            if (found) {
                found.label = label;
            }
        });
    }

    categoryDescription(c: Category): string {
        return this.textDrafts()[this.key('cd', c.id)] ?? c.description ?? '';
    }

    setCategoryDescriptionDraft(id: string, value: string): void {
        this.setTextDraft(this.key('cd', id), value);
    }

    commitCategoryDescription(id: string): void {
        const value = this.takeTextDraft(this.key('cd', id));
        if (value === undefined) {
            return;
        }
        const description = value.trim();
        this.commit(p => {
            const found = p.categories.find(x => x.id === id);
            if (found) {
                found.description = description || undefined;
            }
        });
    }

    updateCategoryIcon(id: string, icon: string): void {
        this.commit(p => {
            const c = p.categories.find(x => x.id === id);
            if (c) {
                c.icon = icon || undefined;
            }
        });
    }

    updateCategoryColor(id: string, raw: string): void {
        const color = normalizeHex(raw);
        if (!color) {
            return;
        }
        this.commit(p => {
            const c = p.categories.find(x => x.id === id);
            if (c) {
                c.color = color;
            }
        });
    }

    deleteCategory(id: string): void {
        this.commit(p => {
            p.categories = p.categories.filter(c => c.id !== id);
        });
    }

    // ---------- jours ----------

    addDay(): void {
        const day: Day = {
            id: newId('d'),
            label: `Jour ${this.days().length + 1}`,
            startTime: this.timeAt(8, 0),
            endTime: this.timeAt(18, 0),
            intervalMinutes: 60,
            assignedVolunteerIds: [],
            cells: [],
            unavailableCells: [],
            needs: []
        };
        this.commit(p => p.days.push(day));
    }

    removeDay(id: string): void {
        this.commit(p => {
            p.days = p.days.filter(d => d.id !== id);
        });
        this.dateModels.update(m => {
            const copy = {...m};
            delete copy[id];
            return copy;
        });
    }

    dayLabel(d: Day): string {
        return this.textDrafts()[this.key('dl', d.id)] ?? d.label;
    }

    setDayLabelDraft(id: string, value: string): void {
        this.setTextDraft(this.key('dl', id), value);
    }

    commitDayLabel(id: string): void {
        const value = this.takeTextDraft(this.key('dl', id));
        if (value === undefined) {
            return;
        }
        const label = value.trim();
        if (!label) {
            return;
        }
        this.commit(p => {
            const found = p.days.find(x => x.id === id);
            if (found) {
                found.label = label;
            }
        });
    }

    dayDescription(d: Day): string {
        return this.textDrafts()[this.key('dd', d.id)] ?? d.description ?? '';
    }

    setDayDescriptionDraft(id: string, value: string): void {
        this.setTextDraft(this.key('dd', id), value);
    }

    commitDayDescription(id: string): void {
        const value = this.takeTextDraft(this.key('dd', id));
        if (value === undefined) {
            return;
        }
        const description = value.trim();
        this.commit(p => {
            const found = p.days.find(x => x.id === id);
            if (found) {
                found.description = description || undefined;
            }
        });
    }

    dateValue(d: Day): Date | null {
        return this.dateModels()[d.id] ?? null;
    }

    updateDate(id: string, value: Date | null): void {
        this.dateModels.update(m => ({...m, [id]: value ?? null}));
        this.commit(p => {
            const found = p.days.find(x => x.id === id);
            if (found) {
                found.date = value ? this.toIsoDate(value) : undefined;
            }
        });
    }

    updateInterval(id: string, value: IntervalMinutes): void {
        this.commit(p => {
            const found = p.days.find(x => x.id === id);
            if (found) {
                found.intervalMinutes = value;
            }
        });
    }

    updateStartTime(id: string, value: Date): void {
        const start = normalizeTime(value);
        this.commit(p => {
            const found = p.days.find(x => x.id === id);
            if (!found) {
                return;
            }
            const end = normalizeTime(found.endTime);
            if (end.getTime() <= start.getTime()) {
                return;
            }
            found.startTime = start;
            found.endTime = end;
        });
    }

    updateEndTime(id: string, value: Date): void {
        const end = normalizeTime(value);
        this.commit(p => {
            const found = p.days.find(x => x.id === id);
            if (!found) {
                return;
            }
            const start = normalizeTime(found.startTime);
            if (end.getTime() <= start.getTime()) {
                return;
            }
            found.endTime = end;
            found.startTime = start;
        });
    }

    // ---------- attribution ----------

    assignedIds(d: Day): string[] {
        return d.assignedVolunteerIds ?? [];
    }

    setAssigned(id: string, ids: string[]): void {
        this.commit(p => {
            const found = p.days.find(x => x.id === id);
            if (found) {
                found.assignedVolunteerIds = [...ids];
            }
        });
    }

    // ---------- validation ----------

    private validate(): boolean {
        const planning = this._draft();
        if (!planning) {
            return true;
        }
        for (const day of planning.days) {
            if (normalizeTime(day.endTime).getTime() <= normalizeTime(day.startTime).getTime()) {
                this.error('planningVolunteers.config.errorHours', {day: day.label || ''});
                return false;
            }
        }
        return true;
    }

    private error(key: string, params: Record<string, string>): void {
        this.messageService.add({
                                    key: 'bottom-center',
                                    severity: 'error',
                                    detail: this.translate.instant(key, params)
                                });
    }

    // ---------- outils internes ----------

    private commit(mutator: (planning: Planning) => void): void {
        const current = this._draft();
        if (!current) {
            return;
        }
        const next = structuredClone(current);
        mutator(next);
        this._draft.set(next);
    }

    private key(prefix: string, id: string): string {
        return `${prefix}:${id}`;
    }

    private setTextDraft(key: string, value: string): void {
        this.textDrafts.update(m => ({...m, [key]: value}));
    }

    private takeTextDraft(key: string): string | undefined {
        const value = this.textDrafts()[key];
        if (value === undefined) {
            return undefined;
        }
        this.textDrafts.update(m => {
            const copy = {...m};
            delete copy[key];
            return copy;
        });
        return value;
    }

    private timeAt(hours: number, minutes: number): Date {
        const d = new Date(this.TIME_REF);
        d.setHours(hours, minutes, 0, 0);
        return d;
    }

    private parseIsoDate(date: string | null): Date | null {
        if (!date) {
            return null;
        }
        const parts = date.split('-').map(Number);
        return parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : null;
    }

    private toIsoDate(d: Date): string {
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }
}
