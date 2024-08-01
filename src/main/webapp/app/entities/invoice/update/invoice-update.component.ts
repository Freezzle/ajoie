import { Component, inject, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IParticipation } from 'app/entities/participation/participation.model';
import { ParticipationService } from 'app/entities/participation/service/participation.service';
import { IInvoice } from '../invoice.model';
import { InvoiceService } from '../service/invoice.service';
import { InvoiceFormService, InvoiceFormGroup } from './invoice-form.service';

@Component({
  standalone: true,
  selector: 'jhi-invoice-update',
  templateUrl: './invoice-update.component.html',
  imports: [SharedModule, FormsModule, ReactiveFormsModule],
})
export class InvoiceUpdateComponent implements OnInit {
  isSaving = false;
  invoice: IInvoice | null = null;

  participationsSharedCollection: IParticipation[] = [];

  protected invoiceService = inject(InvoiceService);
  protected invoiceFormService = inject(InvoiceFormService);
  protected participationService = inject(ParticipationService);
  protected activatedRoute = inject(ActivatedRoute);

  // eslint-disable-next-line @typescript-eslint/member-ordering
  editForm: InvoiceFormGroup = this.invoiceFormService.createInvoiceFormGroup();

  compareParticipation = (o1: IParticipation | null, o2: IParticipation | null): boolean =>
    this.participationService.compareParticipation(o1, o2);

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ invoice }) => {
      this.invoice = invoice;
      if (invoice) {
        this.updateForm(invoice);
      }

      this.loadRelationshipsOptions();
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const invoice = this.invoiceFormService.getInvoice(this.editForm);
    if (invoice.id !== null) {
      this.subscribeToSaveResponse(this.invoiceService.update(invoice));
    } else {
      this.subscribeToSaveResponse(this.invoiceService.create(invoice));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IInvoice>>): void {
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

  protected updateForm(invoice: IInvoice): void {
    this.invoice = invoice;
    this.invoiceFormService.resetForm(this.editForm, invoice);

    this.participationsSharedCollection = this.participationService.addParticipationToCollectionIfMissing<IParticipation>(
      this.participationsSharedCollection,
      invoice.participation,
    );
  }

  protected loadRelationshipsOptions(): void {
    this.participationService
      .query()
      .pipe(map((res: HttpResponse<IParticipation[]>) => res.body ?? []))
      .pipe(
        map((participations: IParticipation[]) =>
          this.participationService.addParticipationToCollectionIfMissing<IParticipation>(participations, this.invoice?.participation),
        ),
      )
      .subscribe((participations: IParticipation[]) => (this.participationsSharedCollection = participations));
  }
}
