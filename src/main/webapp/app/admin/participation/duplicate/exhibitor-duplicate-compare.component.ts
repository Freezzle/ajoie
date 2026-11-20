import {CommonModule} from '@angular/common';
import {ChangeDetectorRef, Component, inject, Input, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import {ButtonBoxComponent} from 'app/shared/components/button-box/button-box.component';
import {CardComponent} from 'app/shared/components/card/card.component';
import {
    ExhibitorService,
    IDuplicateCandidate,
    IDuplicatePreview
} from 'app/admin/exhibitor/service/exhibitor.service';
import {IExhibitor, getExhibitorFullName} from 'app/admin/exhibitor/model/exhibitor.interface';

type DuplicateDecision = 'MERGE' | 'NOT_DUPLICATE' | 'KEEP_SEPARATE';

@Component({
    selector: 'app-exhibitor-duplicate-compare',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, SharedModule, ButtonBoxComponent, CardComponent],
    templateUrl: './exhibitor-duplicate-compare.component.html',
    styleUrl: './exhibitor-duplicate-compare.component.scss'
})
export class ExhibitorDuplicateCompareComponent implements OnInit {
    @Input({required: true}) participationId!: string;
    @Input({required: true}) duplicateExhibitor!: IExhibitor;

    readonly activeModal = inject(NgbActiveModal);
    private readonly exhibitorService = inject(ExhibitorService);
    private readonly cdr = inject(ChangeDetectorRef);

    isLoading = false;
    searchQuery = '';
    onlyDifferences = true;

    candidates: IDuplicateCandidate[] = [];
    selectedTargetId: string | null = null;
    pendingDecision: DuplicateDecision | null = null;
    preview: IDuplicatePreview | null = null;

    readonly getExhibitorFullName = getExhibitorFullName;

    ngOnInit(): void {
        this.loadCandidates();
    }

    loadCandidates(): void {
        if (!this.duplicateExhibitor?.id) {
            return;
        }

        this.isLoading = true;
        this.exhibitorService.getDuplicateCandidates(this.duplicateExhibitor.id).subscribe({
            next: candidates => {
                this.candidates = candidates;
                this.selectedTargetId = this.pickInitialTarget(candidates);
                this.loadPreview();
                this.isLoading = false;
                this.cdr.markForCheck();
            },
            error: () => {
                this.isLoading = false;
                this.cdr.markForCheck();
            }
        });
    }

    searchCandidates(): void {
        const query = this.searchQuery.trim();
        if (!query) {
            this.loadCandidates();
            return;
        }

        this.isLoading = true;
        this.exhibitorService.searchDuplicateCandidates(query).subscribe({
            next: results => {
                const merged = new Map(this.candidates.map(candidate => [candidate.id, candidate]));
                results.forEach(candidate => merged.set(candidate.id, candidate));
                this.candidates = Array.from(merged.values());
                if (!this.selectedTargetId && this.candidates.length > 0) {
                    this.selectedTargetId = this.candidates[0].id;
                }
                this.loadPreview();
                this.isLoading = false;
                this.cdr.markForCheck();
            },
            error: () => {
                this.isLoading = false;
                this.cdr.markForCheck();
            }
        });
    }

    onTargetChange(): void {
        this.loadPreview();
    }

    rowsToDisplay(): IDuplicatePreview['fields'] {
        if (!this.preview?.fields) {
            return [];
        }
        if (!this.onlyDifferences) {
            return this.preview.fields;
        }
        return this.preview.fields.filter(field => field.effect !== 'SAME');
    }

    groups(): {name: string; fields: IDuplicatePreview['fields']}[] {
        const groups = new Map<string, IDuplicatePreview['fields']>();
        this.rowsToDisplay().forEach(field => groups.set(field.group, [...(groups.get(field.group) ?? []), field]));

        return Array.from(groups, ([name, fields]) => ({name, fields}));
    }

    askDecision(decision: DuplicateDecision): void {
        if (decision === 'MERGE' && this.preview?.mergeBlocked) {
            return;
        }
        if ((decision === 'MERGE' || decision === 'KEEP_SEPARATE') && !this.selectedTargetId) {
            return;
        }
        this.pendingDecision = decision;
    }

    cancelDecision(): void {
        this.pendingDecision = null;
    }

    confirmKey(): string {
        switch (this.pendingDecision) {
            case 'MERGE':
                return 'participation.duplicate.confirm.merge';
            case 'NOT_DUPLICATE':
                return 'participation.duplicate.confirm.notDuplicate';
            default:
                return 'participation.duplicate.confirm.keepSeparate';
        }
    }

    applyDecision(): void {
        if (!this.pendingDecision) {
            return;
        }
        const payload = new Map<string, any>();
        payload.set('decision', this.pendingDecision);
        if (this.selectedTargetId) {
            payload.set('targetExhibitorId', this.selectedTargetId);
        }
        this.activeModal.close(payload);
    }
    close(): void {
        this.activeModal.dismiss();
    }

    criterionLabel(criterion: string): string {
        return `participation.duplicate.criteria.${criterion}`;
    }

    effectLabel(effect: string): string {
        return `participation.duplicate.effect.${effect}`;
    }

    private pickInitialTarget(candidates: IDuplicateCandidate[]): string | null {
        if (this.duplicateExhibitor.duplicateOfId) {
            const suggested = candidates.find(candidate => candidate.id === this.duplicateExhibitor.duplicateOfId);
            if (suggested) {
                return suggested.id;
            }
        }
        return candidates.length > 0 ? candidates[0].id : null;
    }

    private loadPreview(): void {
        if (!this.selectedTargetId || !this.duplicateExhibitor?.id) {
            this.preview = null;
            return;
        }

        this.isLoading = true;
        this.exhibitorService.getDuplicatePreview(this.duplicateExhibitor.id, this.selectedTargetId).subscribe({
            next: preview => {
                this.preview = preview;
                this.isLoading = false;
                this.cdr.markForCheck();
            },
            error: () => {
                this.preview = null;
                this.isLoading = false;
                this.cdr.markForCheck();
            }
        });
    }
}
