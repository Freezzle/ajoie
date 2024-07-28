import {Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {combineLatest, filter, Observable, switchMap, tap} from 'rxjs';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import {SortByDirective, SortDirective} from 'app/shared/sort';
import {DurationPipe, FormatMediumDatePipe, FormatMediumDatetimePipe} from 'app/shared/date';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ITEM_DELETED_EVENT} from 'app/config/navigation.constants';
import {IStand} from '../stand.model';
import {EntityArrayResponseType, StandService} from '../service/stand.service';
import StatusPipe from '../../../shared/pipe/status.pipe';
import ColorStatusPipe from '../../../shared/pipe/color-status.pipe';
import {StandFilterFormGroup, StandFormService} from '../update/stand-form.service';
import {Status} from '../../enumerations/status.model';
import {DeleteDialogComponent} from '../../../shared/delete-dialog/delete-dialog.component';

@Component({
    standalone: true,
    selector: 'jhi-stand',
    templateUrl: './stand.component.html',
    imports: [
        RouterModule,
        FormsModule,
        SharedModule,
        SortDirective,
        SortByDirective,
        DurationPipe,
        FormatMediumDatetimePipe,
        FormatMediumDatePipe,
        StatusPipe,
        ColorStatusPipe,
        ReactiveFormsModule,
    ],
})
export class StandComponent implements OnInit {
    public router = inject(Router);
    statusValues = Object.keys(Status);
    stands?: IStand[];
    isLoading = false;
    params: any;
    protected standService = inject(StandService);
    protected activatedRoute = inject(ActivatedRoute);
    protected modalService = inject(NgbModal);
    protected standFormService = inject(StandFormService);
    filters: StandFilterFormGroup = this.standFormService.createFilterFormGroup();

    ngOnInit(): void {
        combineLatest([this.activatedRoute.paramMap, this.activatedRoute.data]).subscribe(([params, data]) => {
            this.params = params;
            if (!this.stands || this.stands.length === 0) {
                this.load();
            }
        });
    }

    delete(stand: IStand): void {
        const modalRef = this.modalService.open(DeleteDialogComponent, {size: 'lg', backdrop: 'static'});
        modalRef.componentInstance.translateKey = 'stand.delete.question';
        modalRef.componentInstance.translateValues = {description: stand.participation?.exhibitor?.fullName};

        modalRef.closed
            .pipe(
                filter(reason => reason === ITEM_DELETED_EVENT),
                switchMap(() => this.standService.delete(stand.id)),
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
        this.stands = this.fillComponentAttributesFromResponseBody(response.body);

        const fullNameFilter = this.filters.get('fullName')?.value;
        if (fullNameFilter && fullNameFilter.length > 0) {
            this.stands = this.stands?.filter(stand =>
                stand.participation?.exhibitor?.fullName?.toLocaleLowerCase()
                    .includes(fullNameFilter.toLocaleLowerCase()),
            );
        }

        const statusFilter = this.filters.get('status')?.value;
        if (statusFilter && statusFilter.length > 0) {
            this.stands = this.stands?.filter(stand => stand.status?.includes(statusFilter));
        }
    }

    protected fillComponentAttributesFromResponseBody(data: IStand[] | null): IStand[] {
        return data ?? [];
    }

    protected queryBackend(): Observable<EntityArrayResponseType> {
        this.isLoading = true;
        const queryObject: any = {
            idSalon: this.params.get('idSalon'),
            idParticipation: this.params.get('idParticipation'),
        };
        return this.standService.query(queryObject).pipe(tap(() => (this.isLoading = false)));
    }
}
