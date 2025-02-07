import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { combineLatest, filter, Observable, of, switchMap, tap } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { SortByDirective, SortDirective } from 'app/shared/sort';
import { DurationPipe, FormatMediumDatePipe, FormatMediumDatetimePipe } from 'app/shared/date';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';
import { IInfoInvoice, IParticipation } from '../participation.model';
import { ParticipationService } from '../service/participation.service';
import ColorStatusPipe from '../../../shared/pipe/color-status.pipe';
import StatusPipe from '../../../shared/pipe/status.pipe';
import CheckBoolPipe from '../../../shared/pipe/check-boolean.pipe';
import ColorBoolPipe from '../../../shared/pipe/color-boolean.pipe';
import FilterComponent from '../../../shared/filter/filter.component';
import { Status } from '../../enumerations/status.model';
import { ParticipationFilterFormGroup, ParticipationFormService } from '../update/participation-form.service';
import { DeleteDialogComponent } from '../../../shared/delete-dialog/delete-dialog.component';
import { finalize } from 'rxjs/operators';
import { containExhibitorName, getExhibitorName } from '../../exhibitor/exhibitor.model';

@Component({
  standalone: true,
  selector: 'jhi-participation',
  templateUrl: './participation.component.html',
  imports: [
    RouterModule,
    FormsModule,
    SharedModule,
    SortDirective,
    SortByDirective,
    DurationPipe,
    FormatMediumDatetimePipe,
    FormatMediumDatePipe,
    ColorStatusPipe,
    StatusPipe,
    CheckBoolPipe,
    ColorBoolPipe,
    FilterComponent,
    ReactiveFormsModule,
  ],
})
export class ParticipationComponent implements OnInit {
  protected participationFormService = inject(ParticipationFormService);
  protected participationService = inject(ParticipationService);
  protected activatedRoute = inject(ActivatedRoute);
  protected modalService = inject(NgbModal);

  participations: IParticipation[] = [];
  isLoading = false;
  statusValues = Object.keys(Status);
  params: any;
  filters: FormGroup<ParticipationFilterFormGroup> =
    this.participationFormService.createFilterFormGroup();
  private infoInvoices: { [key: string]: Observable<IInfoInvoice> } = {};

  ngOnInit(): void {
    combineLatest([this.activatedRoute.paramMap, this.activatedRoute.data]).subscribe(
      ([params, data]) => {
        this.params = params;

        if (!this.participations || this.participations.length === 0) {
          this.actionFilter();
        }
      },
    );
  }

  delete(participation: IParticipation): void {
    const modalRef = this.modalService.open(DeleteDialogComponent, {
      size: 'lg',
      backdrop: 'static',
    });
    modalRef.componentInstance.translateKey = 'participation.delete.question';
    modalRef.componentInstance.translateValues = {
      fullName: getExhibitorName(participation.exhibitor),
    };

    modalRef.closed
      .pipe(
        filter((reason) => reason === ITEM_DELETED_EVENT),
        switchMap(() => this.participationService.delete(participation.id)),
        tap(() => this.actionFilter()), // Recharge les données
      )
      .subscribe();
  }

  actionFilter(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;

    this.participationService
      .query(this.params.get('idSalon'))
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe((result) => {
        this.participations = result.body ?? [];

        this.loadInfoInvoice();

        const fullNameFilter = this.filters.get('fullName')?.value;
        if (fullNameFilter && fullNameFilter.length > 0) {
          this.participations = this.participations?.filter((participation) =>
            containExhibitorName(participation.exhibitor, fullNameFilter),
          );
        }

        const statusFilter = this.filters.get('status')?.value;
        if (statusFilter && statusFilter.length > 0) {
          this.participations = this.participations?.filter((participation) =>
            participation.status?.includes(statusFilter),
          );
        }
      });
  }

  loadInfoInvoice(): void {
    this.participations?.forEach((participation) => {
      this.participationService
        .getInfoInvoice(participation.id)
        .pipe(
          tap((infoInvoice) => {
            this.infoInvoices[participation.id] = of(infoInvoice);
          }),
        )
        .subscribe();
    });
  }

  getInfoInvoice(idParticipation: string): Observable<IInfoInvoice> {
    return this.infoInvoices[idParticipation] ? this.infoInvoices[idParticipation] : of();
  }

  refresh(): void {
    this.filters.reset();
    this.actionFilter();
  }

  previousState(): void {
    window.history.back();
  }
}
