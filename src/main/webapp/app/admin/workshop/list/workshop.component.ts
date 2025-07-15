import {Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute, RouterModule} from '@angular/router';
import {combineLatest, filter, switchMap, tap} from 'rxjs';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import {FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ITEM_DELETED_EVENT} from 'app/config/navigation.constants';
import {IWorkshop} from '../model/workshop.interface';
import {WorkshopService} from '../service/workshop.service';
import StatusPipe from '../../../shared/pipe/status.pipe';
import ColorStatusPipe from '../../../shared/pipe/color-status.pipe';
import {Status} from '../../enumerations/status.model';
import {WorkshopFilterFormGroup, WorkshopFormService} from '../service/workshop-form.service';
import {DeleteDialogComponent} from '../../../shared/delete-dialog/delete-dialog.component';
import {finalize} from 'rxjs/operators';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {LinkBoxComponent} from '../../../shared/components/link-box/link-box.component';
import {PaginationComponent} from '../../../shared/pagination/pagination.component';
import {PaginationEvent} from '../../../shared/pagination/pagination-event.interface';
import {
    containsParticipationName,
    getFormattedParticipationName,
} from '../../participation/model/participation.interface';
import {AlertErrorComponent} from "../../../shared/alert/alert-error.component";

@Component({
    selector: 'jhi-workshop',
    templateUrl: './workshop.component.html',
    imports: [
        RouterModule,
        FormsModule,
        SharedModule,
        StatusPipe,
        ColorStatusPipe,
        ReactiveFormsModule,
        ButtonBoxComponent,
        LinkBoxComponent,
        PaginationComponent,
        AlertErrorComponent,
    ]
})
export class WorkshopComponent implements OnInit {
    protected activatedRoute = inject(ActivatedRoute);
    protected modalService = inject(NgbModal);
    protected workshopService = inject(WorkshopService);
    protected workshopFormService = inject(WorkshopFormService);

    workshops: IWorkshop[] = [];
    workshopsPaginated: IWorkshop[] = [];
    isLoading = false;
    params: any;
    statusValues = Object.keys(Status);
    filters: FormGroup<WorkshopFilterFormGroup> =
        this.workshopFormService.createFilterFormGroup();

    ngOnInit(): void {
        combineLatest([this.activatedRoute.paramMap, this.activatedRoute.data]).subscribe(
            ([params, data]) => {
                this.params = params;

                if (!this.workshops || this.workshops.length === 0) {
                    this.actionFilter();
                }
            },
        );
    }

    delete(workshop: IWorkshop): void {
        const modalRef = this.modalService.open(DeleteDialogComponent, {
            size: 'lg',
            backdrop: 'static',
        });
        modalRef.componentInstance.translateKey = 'workshop.delete.question';
        modalRef.componentInstance.translateValues = {title: workshop.title};

        modalRef.closed
            .pipe(
                filter((reason) => reason === ITEM_DELETED_EVENT),
                switchMap(() => this.workshopService.delete(workshop.id)),
                tap(() => this.actionFilter()),
            )
            .subscribe();
    }

    actionFilter(): void {
        this.load();
    }

    load(): void {
        this.isLoading = true;

        const queryObject: any = {
            idSalon: this.params.get('idSalon'),
            idParticipation: this.params.get('idParticipation'),
        };

        this.workshopService
            .query(queryObject)
            .pipe(finalize(() => (this.isLoading = false)))
            .subscribe((result) => {
                this.workshops = result ?? [];

                const fullNameFilter = this.filters.get('fullName')?.value;
                if (fullNameFilter && fullNameFilter.length > 0) {
                    this.workshops = this.workshops?.filter((workshop) =>
                        containsParticipationName(workshop.participation, fullNameFilter),
                    );
                }

                const statusFilter = this.filters.get('status')?.value;
                if (statusFilter && statusFilter.length > 0) {
                    this.workshops = this.workshops?.filter((workshop) =>
                        workshop.status?.includes(statusFilter),
                    );
                }

                this.refreshWorkshops({page: 1, pageSize: 10});
            });
    }

    refresh(): void {
        this.filters.reset();
        this.actionFilter();
    }

    previousState(): void {
        window.history.back();
    }

    refreshWorkshops(event: PaginationEvent): void {
        this.workshopsPaginated = this.workshops.slice((event.page - 1) * event.pageSize,
            (event.page - 1) * event.pageSize + event.pageSize);
    }

    protected readonly getFormattedParticipationName = getFormattedParticipationName;
}
