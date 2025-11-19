import {Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute, ParamMap, RouterModule} from '@angular/router';
import {combineLatest, filter, switchMap, tap} from 'rxjs';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import {FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ITEM_DELETED_EVENT} from 'app/config/navigation.constants';
import {IStand} from '../model/stand.interface';
import {StandService} from '../service/stand.service';
import StatusPipe from '../../../shared/pipe/status.pipe';
import ColorStatusPipe from '../../../shared/pipe/color-status.pipe';
import {StandFilterFormGroup, StandFormService} from '../service/stand-form.service';
import {formatterStatus, Status} from '../../enumerations/status.model';
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
import {getFirstExhibitorName} from '../../exhibitor/model/exhibitor.interface';
import {Category, formatterCategory} from '../../enumerations/category.model';
import {AlertService} from '../../../core/util/alert.service';
import {copyToClipboard} from '../../../core/util/utils';
import {ProgressSpinner} from "primeng/progressspinner";

@Component({
    selector: 'jhi-stand',
    templateUrl: './stand.component.html',
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
        ProgressSpinner,
    ]
})
export class StandComponent implements OnInit {
    protected standService = inject(StandService);
    protected activatedRoute = inject(ActivatedRoute);
    protected modalService = inject(NgbModal);
    protected standFormService = inject(StandFormService);
    protected alertService = inject(AlertService);

    statusValues = Object.keys(Status);
    stands: IStand[] = [];
    standsPaginated: IStand[] = [];
    isLoading = false;
    params!: ParamMap;
    filters: FormGroup<StandFilterFormGroup> = this.standFormService.createFilterFormGroup();
    standardView = true;

    ngOnInit(): void {
        combineLatest([this.activatedRoute.paramMap, this.activatedRoute.data]).subscribe(
            ([params, data]) => {
                this.params = params;

                if (!this.stands || this.stands.length === 0) {
                    this.actionFilter();
                }
            },
        );
    }

    delete(stand: IStand): void {
        const modalRef = this.modalService.open(DeleteDialogComponent, {
            size: 'lg',
            backdrop: 'static',
        });
        modalRef.componentInstance.translateKey = 'stand.delete.question';
        modalRef.componentInstance.translateValues = {
            description: getFormattedParticipationName(stand.participation),
        };

        modalRef.closed
            .pipe(
                filter((reason) => reason === ITEM_DELETED_EVENT),
                switchMap(() => this.standService.delete(stand.id)),
                tap(() => this.actionFilter()), // Recharge les données
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
        this.standService
            .query(queryObject)
            .pipe(finalize(() => (this.isLoading = false)))
            .subscribe((result) => {
                this.stands = result ?? [];

                const fullNameFilter = this.filters.get('fullName')?.value;
                if (fullNameFilter && fullNameFilter.length > 0) {
                    this.stands = this.stands.filter((stand) =>
                        containsParticipationName(stand.participation, fullNameFilter),
                    );
                }

                const statusFilter = this.filters.get('status')?.value;
                if (statusFilter && statusFilter.length > 0) {
                    this.stands = this.stands.filter((stand) => stand.status?.includes(statusFilter));
                }

                this.refreshStands({page: 1, pageSize: 10});
            });
    }

    refresh(): void {
        this.filters.reset();
        this.actionFilter();
    }

    previousState(): void {
        window.history.back();
    }

    refreshStands(event: PaginationEvent): void {
        this.standsPaginated = this.stands.slice((event.page - 1) * event.pageSize,
            (event.page - 1) * event.pageSize + event.pageSize);
    }

    clipboard(value: string | null | undefined): void {
        copyToClipboard(value);
    }

    changeTechnicalView(): void {
        this.stands.sort((a, b) => {
            const nameA = a.category || '';
            const nameB = b.category || '';

            if (nameA < nameB) {
                return -1;
            }
            if (nameA > nameB) {
                return 1;
            }

            const nameAName = a.participation?.therapistName?.toLocaleLowerCase() || '';
            const nameBName = b.participation?.therapistName?.toLocaleLowerCase() || '';

            if (nameAName < nameBName) {
                return -1;
            }
            if (nameAName > nameBName) {
                return 1;
            }
            return 0;
        });
        this.standardView = false;
    }

    protected readonly getFormattedParticipationName = getFormattedParticipationName;
    protected readonly getFirstExhibitorName = getFirstExhibitorName;
    protected readonly formatterCategory = formatterCategory;
    protected readonly formatterStatus = formatterStatus;
    protected readonly Status = Status;
    protected readonly Category = Category;
}
