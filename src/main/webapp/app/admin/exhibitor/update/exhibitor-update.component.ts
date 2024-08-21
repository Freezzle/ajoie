import {Component, inject, OnInit} from '@angular/core';
import {HttpResponse} from '@angular/common/http';
import {ActivatedRoute} from '@angular/router';
import {Observable} from 'rxjs';
import {finalize} from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {IExhibitor} from '../exhibitor.model';
import {ExhibitorService} from '../service/exhibitor.service';
import {ExhibitorFormGroup, ExhibitorFormService} from './exhibitor-form.service';

@Component({
               standalone: true,
               selector: 'jhi-exhibitor-update',
               templateUrl: './exhibitor-update.component.html',
               imports: [SharedModule, FormsModule, ReactiveFormsModule],
           })
export class ExhibitorUpdateComponent implements OnInit {
    isSaving = false;
    exhibitor: IExhibitor | null = null;

    protected exhibitorService = inject(ExhibitorService);
    protected exhibitorFormService = inject(ExhibitorFormService);
    // eslint-disable-next-line @typescript-eslint/member-ordering
    editForm: ExhibitorFormGroup = this.exhibitorFormService.createExhibitorFormGroup();
    protected activatedRoute = inject(ActivatedRoute);

    ngOnInit(): void {
        this.activatedRoute.data.subscribe(({exhibitor}) => {
            this.exhibitor = exhibitor;
            if (exhibitor) {
                this.updateForm(exhibitor);
            }
        });
    }

    previousState(): void {
        window.history.back();
    }

    save(): void {
        this.isSaving = true;
        const exhibitor = this.exhibitorFormService.getExhibitor(this.editForm);
        if (exhibitor.id !== null) {
            this.subscribeToSaveResponse(this.exhibitorService.update(exhibitor));
        } else {
            this.subscribeToSaveResponse(this.exhibitorService.create(exhibitor));
        }
    }

    protected subscribeToSaveResponse(result: Observable<HttpResponse<IExhibitor>>): void {
        result.pipe(finalize(() => this.onSaveFinalize())).subscribe({
                                                                         next: () => this.onSaveSuccess(),
                                                                         error: () => this.onSaveError(),
                                                                     });
    }

    protected onSaveSuccess(): void {
        this.previousState();
    }

    protected onSaveError(): void {
        // Api for inheritance.
    }

    protected onSaveFinalize(): void {
        this.isSaving = false;
    }

    protected updateForm(exhibitor: IExhibitor): void {
        this.exhibitor = exhibitor;
        this.exhibitorFormService.resetForm(this.editForm, exhibitor);
    }
}
