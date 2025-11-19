import {Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute, ParamMap, RouterModule} from '@angular/router';
import {combineLatest, filter, switchMap, tap} from 'rxjs';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import {FormatMediumDatePipe} from 'app/shared/date';
import {FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ITEM_DELETED_EVENT} from 'app/config/navigation.constants';
import {
    containsParticipationName,
    getFormattedParticipationName,
    IInfoInvoice,
    IParticipation,
} from '../model/participation.interface';
import {ParticipationService} from '../service/participation.service';
import ColorStatusPipe from '../../../shared/pipe/color-status.pipe';
import StatusPipe from '../../../shared/pipe/status.pipe';
import {Status} from '../../enumerations/status.model';
import {ParticipationFilterFormGroup, ParticipationFormService} from '../service/participation-form.service';
import {DeleteDialogComponent} from '../../../shared/delete-dialog/delete-dialog.component';
import {finalize} from 'rxjs/operators';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {LinkBoxComponent} from '../../../shared/components/link-box/link-box.component';
import {PaginationComponent} from '../../../shared/pagination/pagination.component';
import {PaginationEvent} from '../../../shared/pagination/pagination-event.interface';
import {ProgressSpinner} from "primeng/progressspinner";

@Component({
    selector: 'jhi-participation',
    templateUrl: './participation.component.html',
    imports: [
        RouterModule,
        FormsModule,
        SharedModule,
        FormatMediumDatePipe,
        ColorStatusPipe,
        StatusPipe,
        ReactiveFormsModule,
        ButtonBoxComponent,
        LinkBoxComponent,
        PaginationComponent,
        ProgressSpinner,
    ]
})
export class ParticipationComponent implements OnInit {
    private readonly participationFormService = inject(ParticipationFormService);
    private readonly participationService = inject(ParticipationService);
    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly modalService = inject(NgbModal);

    participations: IParticipation[] = [];
    participationsPaginated: IParticipation[] = [];
    isLoading = false;
    statusValues = Object.keys(Status);
    params!: ParamMap;
    filters: FormGroup<ParticipationFilterFormGroup> =
        this.participationFormService.createFilterFormGroup();
    infoInvoicesMap: { [id: string]: IInfoInvoice } = {};

    ngOnInit(): void {
        combineLatest([this.activatedRoute.paramMap, this.activatedRoute.data]).subscribe(
            ([params]) => {
                this.params = params;

                if (!this.participations || this.participations.length === 0) {
                    this.actionFilter();
                    this.participationService.getInfosInvoiceForSalon(this.params.get('idSalon')!).subscribe(infoInvoicesMap => {
                        this.infoInvoicesMap = infoInvoicesMap || {};
                    });
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
            fullName: getFormattedParticipationName(participation),
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
        const idSalon = this.params.get('idSalon')!;

        this.participationService
            .query(idSalon)
            .pipe(finalize(() => (this.isLoading = false)),)
            .subscribe(result => {
                this.participations = result.body ?? [];

                // filtres sur fullName/status AVANT l’appel bulk, si tu veux limiter
                const fullNameFilter = this.filters.get('fullName')?.value;
                if (fullNameFilter && fullNameFilter.length > 0) {
                    this.participations = this.participations?.filter(participation =>
                        containsParticipationName(participation, fullNameFilter),
                    );
                }

                const statusFilter = this.filters.get('status')?.value;
                if (statusFilter && statusFilter.length > 0) {
                    this.participations = this.participations?.filter(participation =>
                        participation.status?.includes(statusFilter),
                    );
                }
                this.refreshParticipations({page: 1, pageSize: 10});
            });
    }

    getInfoInvoice(idParticipation: string): IInfoInvoice {
        return this.infoInvoicesMap[idParticipation];
    }

    refresh(): void {
        this.filters.reset();
        this.actionFilter();
    }

    previousState(): void {
        window.history.back();
    }

    refreshParticipations(event: PaginationEvent): void {
        this.participationsPaginated = this.participations.slice((event.page - 1) * event.pageSize,
            (event.page - 1) * event.pageSize + event.pageSize);
    }
}
