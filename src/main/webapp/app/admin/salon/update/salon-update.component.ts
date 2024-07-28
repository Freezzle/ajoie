import { Component, inject, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ISalon } from '../salon.model';
import { SalonService } from '../service/salon.service';
import { SalonFormService, SalonFormGroup } from './salon-form.service';

@Component({
  standalone: true,
  selector: 'jhi-salon-update',
  templateUrl: './salon-update.component.html',
  imports: [SharedModule, FormsModule, ReactiveFormsModule],
})
export class SalonUpdateComponent implements OnInit {
  isSaving = false;
  salon: ISalon | null = null;

  protected salonService = inject(SalonService);
  protected salonFormService = inject(SalonFormService);
  protected activatedRoute = inject(ActivatedRoute);

  // eslint-disable-next-line @typescript-eslint/member-ordering
  editForm: SalonFormGroup = this.salonFormService.createSalonFormGroup();

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ salon }) => {
      this.salon = salon;
      if (salon) {
        this.updateForm(salon);
      }
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const salon = this.salonFormService.getSalon(this.editForm);
    if (salon.id !== null) {
      this.subscribeToSaveResponse(this.salonService.update(salon));
    } else {
      this.subscribeToSaveResponse(this.salonService.create(salon));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<ISalon>>): void {
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

  protected updateForm(salon: ISalon): void {
    this.salon = salon;
    this.salonFormService.resetForm(this.editForm, salon);
  }
}
