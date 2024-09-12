import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { combineLatest, filter, Observable, switchMap, tap } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { SortByDirective, SortDirective } from 'app/shared/sort';
import { DurationPipe, FormatMediumDatePipe, FormatMediumDatetimePipe } from 'app/shared/date';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';
import { IParticipation } from '../participation.model';
import { EntityArrayResponseType, ParticipationService } from '../service/participation.service';
import ColorStatusPipe from '../../../shared/pipe/color-status.pipe';
import StatusPipe from '../../../shared/pipe/status.pipe';
import CheckBoolPipe from '../../../shared/pipe/check-boolean.pipe';
import ColorBoolPipe from '../../../shared/pipe/color-boolean.pipe';
import FilterComponent from '../../../shared/filter/filter.component';
import { Status } from '../../enumerations/status.model';
import { finalize } from 'rxjs/operators';
import { ParticipationFilterFormGroup, ParticipationFormService } from '../update/participation-form.service';
import { DeleteDialogComponent } from '../../../shared/delete-dialog/delete-dialog.component';

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
  public router = inject(Router);
  participations?: IParticipation[];
  isLoading = false;
  statusValues = Object.keys(Status);
  params: any;
  protected participationFormService = inject(ParticipationFormService);
  filters: ParticipationFilterFormGroup = this.participationFormService.createFilterFormGroup();
  protected participationService = inject(ParticipationService);
  protected activatedRoute = inject(ActivatedRoute);
  protected modalService = inject(NgbModal);

  ngOnInit(): void {
    combineLatest([this.activatedRoute.paramMap, this.activatedRoute.data]).subscribe(([params, data]) => {
      this.params = params;
      if (!this.participations || this.participations.length === 0) {
        this.load();
      }
    });
  }

  delete(participation: IParticipation): void {
    const modalRef = this.modalService.open(DeleteDialogComponent, { size: 'lg', backdrop: 'static' });
    modalRef.componentInstance.translateKey = 'participation.delete.question';
    modalRef.componentInstance.translateValues = { fullName: participation.exhibitor?.fullName };

    modalRef.closed
      .pipe(
        filter(reason => reason === ITEM_DELETED_EVENT),
        switchMap(() => this.participationService.delete(participation.id)),
        tap(() => this.load()), // Recharge les données
      )
      .subscribe();
  }

  actionFilter(): void {
    this.load();
  }

  load(): void {
    this.queryBackend().subscribe({
      next: (res: EntityArrayResponseType) => {
        this.onResponseSuccess(res);
      },
    });
  }

  refresh(): void {
    this.filters.reset();
    this.load();
  }

  previousState(): void {
    window.history.back();
  }

  protected onResponseSuccess(response: EntityArrayResponseType): void {
    this.participations = this.fillComponentAttributesFromResponseBody(response.body);

    const fullNameFilter = this.filters.get('fullName')?.value;
    if (fullNameFilter && fullNameFilter.length > 0) {
      this.participations = this.participations?.filter(participation =>
        participation.exhibitor?.fullName?.toLocaleLowerCase().includes(fullNameFilter.toLocaleLowerCase()),
      );
    }

    const statusFilter = this.filters.get('status')?.value;
    if (statusFilter && statusFilter.length > 0) {
      this.participations = this.participations?.filter(participation => participation.status?.includes(statusFilter));
    }
  }

  protected fillComponentAttributesFromResponseBody(data: IParticipation[] | null): IParticipation[] {
    return data ?? [];
  }

  protected queryBackend(): Observable<EntityArrayResponseType> {
    this.isLoading = true;
    return this.participationService.query(this.params.get('idSalon')).pipe(finalize(() => (this.isLoading = false)));
  }
}
