import { Component, inject, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IStand } from 'app/entities/stand/stand.model';
import { StandService } from 'app/entities/stand/service/stand.service';
import { IBilling } from '../billing.model';
import { BillingService } from '../service/billing.service';
import { BillingFormService, BillingFormGroup } from './billing-form.service';

@Component({
  standalone: true,
  selector: 'jhi-billing-update',
  templateUrl: './billing-update.component.html',
  imports: [SharedModule, FormsModule, ReactiveFormsModule],
})
export class BillingUpdateComponent implements OnInit {
  isSaving = false;
  billing: IBilling | null = null;

  standsCollection: IStand[] = [];

  protected billingService = inject(BillingService);
  protected billingFormService = inject(BillingFormService);
  protected standService = inject(StandService);
  protected activatedRoute = inject(ActivatedRoute);

  // eslint-disable-next-line @typescript-eslint/member-ordering
  editForm: BillingFormGroup = this.billingFormService.createBillingFormGroup();

  compareStand = (o1: IStand | null, o2: IStand | null): boolean => this.standService.compareStand(o1, o2);

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ billing }) => {
      this.billing = billing;
      if (billing) {
        this.updateForm(billing);
      }

      this.loadRelationshipsOptions();
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const billing = this.billingFormService.getBilling(this.editForm);
    if (billing.id !== null) {
      this.subscribeToSaveResponse(this.billingService.update(billing));
    } else {
      this.subscribeToSaveResponse(this.billingService.create(billing));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IBilling>>): void {
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

  protected updateForm(billing: IBilling): void {
    this.billing = billing;
    this.billingFormService.resetForm(this.editForm, billing);

    this.standsCollection = this.standService.addStandToCollectionIfMissing<IStand>(this.standsCollection, billing.stand);
  }

  protected loadRelationshipsOptions(): void {
    this.standService
      .query({ filter: 'billing-is-null' })
      .pipe(map((res: HttpResponse<IStand[]>) => res.body ?? []))
      .pipe(map((stands: IStand[]) => this.standService.addStandToCollectionIfMissing<IStand>(stands, this.billing?.stand)))
      .subscribe((stands: IStand[]) => (this.standsCollection = stands));
  }
}
