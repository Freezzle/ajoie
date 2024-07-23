import { Component, inject, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IDimensionStand } from '../dimension-stand.model';
import { DimensionStandService } from '../service/dimension-stand.service';
import { DimensionStandFormService, DimensionStandFormGroup } from './dimension-stand-form.service';

@Component({
  standalone: true,
  selector: 'jhi-dimension-stand-update',
  templateUrl: './dimension-stand-update.component.html',
  imports: [SharedModule, FormsModule, ReactiveFormsModule],
})
export class DimensionStandUpdateComponent implements OnInit {
  isSaving = false;
  dimensionStand: IDimensionStand | null = null;

  protected dimensionStandService = inject(DimensionStandService);
  protected dimensionStandFormService = inject(DimensionStandFormService);
  protected activatedRoute = inject(ActivatedRoute);

  // eslint-disable-next-line @typescript-eslint/member-ordering
  editForm: DimensionStandFormGroup = this.dimensionStandFormService.createDimensionStandFormGroup();

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ dimensionStand }) => {
      this.dimensionStand = dimensionStand;
      if (dimensionStand) {
        this.updateForm(dimensionStand);
      }
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const dimensionStand = this.dimensionStandFormService.getDimensionStand(this.editForm);
    if (dimensionStand.id !== null) {
      this.subscribeToSaveResponse(this.dimensionStandService.update(dimensionStand));
    } else {
      this.subscribeToSaveResponse(this.dimensionStandService.create(dimensionStand));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IDimensionStand>>): void {
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

  protected updateForm(dimensionStand: IDimensionStand): void {
    this.dimensionStand = dimensionStand;
    this.dimensionStandFormService.resetForm(this.editForm, dimensionStand);
  }
}
