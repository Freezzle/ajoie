import {CommonModule} from '@angular/common';
import {Component, computed, inject, Input, OnDestroy, OnInit, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';

import {ButtonModule} from 'primeng/button';
import {TableModule} from 'primeng/table';
import {InputTextModule} from 'primeng/inputtext';
import {SelectModule} from 'primeng/select';
import {ColorPickerModule} from 'primeng/colorpicker';
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {ConfirmationService} from 'primeng/api';

import {Category, newId, normalizeHex} from '../volunteer-planning-model';
import {ButtonBoxComponent} from '../../../../shared/components/button-box/button-box.component';
import {DialogDraftService} from '../../../../shared/services/dialog-draft.service';

@Component({
               selector: 'category-manager',
               standalone: true,
               imports: [
                   CommonModule,
                   FormsModule,
                   ButtonModule,
                   TableModule,
                   InputTextModule,
                   SelectModule,
                   ColorPickerModule,
                   ConfirmDialogModule,
                   ButtonBoxComponent
               ],
               providers: [ConfirmationService],
               templateUrl: './category-manager.component.html'
           })
export class CategoryManagerComponent implements OnInit, OnDestroy {
    private readonly draftService = inject(DialogDraftService);

    _draft = signal<Category[] | null>(null);
    categories = computed(() => this._draft() ?? []);
    private labelDraft = signal<Record<string, string>>({});

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

    @Input({required: true})
    set data(value: Category[]) {
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

    categoryLabel(c: Category): string {
        return this.labelDraft()[c.id] ?? c.label;
    }

    setCategoryLabelDraft(categoryId: string, value: string) {
        this.labelDraft.update(m => ({...m, [categoryId]: value}));
    }

    commitCategoryLabel(categoryId: string) {
        const value = this.labelDraft()[categoryId];
        if (value === undefined) {
            return;
        }

        const v = value.trim();
        if (!v) {
            return;
        }

        this.commit(next => {
            const found = next.find(x => x.id === categoryId);
            if (found) {
                found.label = v;
            }
        });

        this.labelDraft.update(m => {
            const copy = {...m};
            delete copy[categoryId];
            return copy;
        });
    }

    addCategory() {
        this.commit(next =>
                        next.push({id: newId('c'), label: 'Nouvelle catégorie', icon: 'pi pi-box', color: '#ffe8b5'})
        );
    }

    updateIcon(categoryId: string, icon: string) {
        this.commit(next => {
            const c = next.find(x => x.id === categoryId);
            if (c) {
                c.icon = icon;
            }
        });
    }

    updateColor(categoryId: string, raw: string) {
        const color = normalizeHex(raw);
        if (!color) {
            return;
        }

        this.commit(next => {
            const c = next.find(x => x.id === categoryId);
            if (c) {
                c.color = color;
            }
        });
    }

    deleteCategory(categoryId: string) {
        this.commit(next => {
            const idx = next.findIndex(c => c.id === categoryId);
            if (idx >= 0) {
                next.splice(idx, 1);
            }
        });
    }

    private commit(mutator: (next: Category[]) => void) {
        const current = this._draft();
        if (!current) {
            return;
        }
        const next = structuredClone(current);
        mutator(next);
        this._draft.set(next);
    }
}