import { Component, inject, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IExponent } from '../exponent.model';
import { ExponentService } from '../service/exponent.service';
import { ExponentFormGroup, ExponentFormService } from './exponent-form.service';

@Component({
  standalone: true,
  selector: 'jhi-exponent-update',
  templateUrl: './exponent-update.component.html',
  imports: [SharedModule, FormsModule, ReactiveFormsModule],
})
export class ExponentUpdateComponent implements OnInit {
  isSaving = false;
  exponent: IExponent | null = null;

  protected exponentService = inject(ExponentService);
  protected exponentFormService = inject(ExponentFormService);
  protected activatedRoute = inject(ActivatedRoute);

  // eslint-disable-next-line @typescript-eslint/member-ordering
  editForm: ExponentFormGroup = this.exponentFormService.createExponentFormGroup();

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ exponent }) => {
      this.exponent = exponent;
      if (exponent) {
        this.updateForm(exponent);
      }
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const exponent = this.exponentFormService.getExponent(this.editForm);
    if (exponent.id !== null) {
      this.subscribeToSaveResponse(this.exponentService.update(exponent));
    } else {
      this.subscribeToSaveResponse(this.exponentService.create(exponent));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IExponent>>): void {
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

  protected updateForm(exponent: IExponent): void {
    this.exponent = exponent;
    this.exponentFormService.resetForm(this.editForm, exponent);
  }
}
