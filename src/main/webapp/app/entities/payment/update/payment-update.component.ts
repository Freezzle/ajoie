import { Component, inject, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IParticipation } from 'app/entities/participation/participation.model';
import { ParticipationService } from 'app/entities/participation/service/participation.service';
import { Mode } from 'app/entities/enumerations/mode.model';
import { PaymentService } from '../service/payment.service';
import { IPayment } from '../payment.model';
import { PaymentFormService, PaymentFormGroup } from './payment-form.service';

@Component({
  standalone: true,
  selector: 'jhi-payment-update',
  templateUrl: './payment-update.component.html',
  imports: [SharedModule, FormsModule, ReactiveFormsModule],
})
export class PaymentUpdateComponent implements OnInit {
  isSaving = false;
  payment: IPayment | null = null;
  modeValues = Object.keys(Mode);

  participationsSharedCollection: IParticipation[] = [];

  protected paymentService = inject(PaymentService);
  protected paymentFormService = inject(PaymentFormService);
  protected participationService = inject(ParticipationService);
  protected activatedRoute = inject(ActivatedRoute);

  // eslint-disable-next-line @typescript-eslint/member-ordering
  editForm: PaymentFormGroup = this.paymentFormService.createPaymentFormGroup();

  compareParticipation = (o1: IParticipation | null, o2: IParticipation | null): boolean =>
    this.participationService.compareParticipation(o1, o2);

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ payment }) => {
      this.payment = payment;
      if (payment) {
        this.updateForm(payment);
      }

      this.loadRelationshipsOptions();
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const payment = this.paymentFormService.getPayment(this.editForm);
    if (payment.id !== null) {
      this.subscribeToSaveResponse(this.paymentService.update(payment));
    } else {
      this.subscribeToSaveResponse(this.paymentService.create(payment));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IPayment>>): void {
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

  protected updateForm(payment: IPayment): void {
    this.payment = payment;
    this.paymentFormService.resetForm(this.editForm, payment);

    this.participationsSharedCollection = this.participationService.addParticipationToCollectionIfMissing<IParticipation>(
      this.participationsSharedCollection,
      payment.participation,
    );
  }

  protected loadRelationshipsOptions(): void {
    this.participationService
      .query()
      .pipe(map((res: HttpResponse<IParticipation[]>) => res.body ?? []))
      .pipe(
        map((participations: IParticipation[]) =>
          this.participationService.addParticipationToCollectionIfMissing<IParticipation>(participations, this.payment?.participation),
        ),
      )
      .subscribe((participations: IParticipation[]) => (this.participationsSharedCollection = participations));
  }
}
