import {Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute, ParamMap, RouterModule} from '@angular/router';
import {combineLatest, filter, switchMap, tap} from 'rxjs';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import {FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ITEM_DELETED_EVENT} from 'app/config/navigation.constants';
import {IConference} from '../model/conference.interface';
import {ConferenceService} from '../service/conference.service';
import StatusPipe from '../../../shared/pipe/status.pipe';
import ColorStatusPipe from '../../../shared/pipe/color-status.pipe';
import {Status} from '../../enumerations/status.model';
import {ConferenceFilterFormGroup, ConferenceFormService} from '../service/conference-form.service';
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
import {ProgressSpinner} from "primeng/progressspinner";

@Component({
    selector: 'jhi-conference',
    templateUrl: './conference.component.html',
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
        ProgressSpinner,
    ]
})
export class ConferenceComponent implements OnInit {
    protected activatedRoute = inject(ActivatedRoute);
    protected modalService = inject(NgbModal);
    protected conferenceService = inject(ConferenceService);
    protected conferenceFormService = inject(ConferenceFormService);

    conferences: IConference[] = [];
    conferencesPaginated: IConference[] = [];
    isLoading = false;
    params!: ParamMap;
    statusValues = Object.keys(Status);
    filters: FormGroup<ConferenceFilterFormGroup> =
        this.conferenceFormService.createFilterFormGroup();

    ngOnInit(): void {
        combineLatest([this.activatedRoute.paramMap, this.activatedRoute.data]).subscribe(
            ([params, data]) => {
                this.params = params;

                if (!this.conferences || this.conferences.length === 0) {
                    this.actionFilter();
                }
            },
        );
    }

    delete(conference: IConference): void {
        const modalRef = this.modalService.open(DeleteDialogComponent, {
            size: 'lg',
            backdrop: 'static',
        });
        modalRef.componentInstance.translateKey = 'conference.delete.question';
        modalRef.componentInstance.translateValues = {title: conference.title};

        modalRef.closed
            .pipe(
                filter((reason) => reason === ITEM_DELETED_EVENT),
                switchMap(() => this.conferenceService.delete(conference.id)),
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

        this.conferenceService
            .query(queryObject)
            .pipe(finalize(() => (this.isLoading = false)))
            .subscribe((result) => {
                this.conferences = result ?? [];

                const fullNameFilter = this.filters.get('fullName')?.value;
                if (fullNameFilter && fullNameFilter.length > 0) {
                    this.conferences = this.conferences?.filter((conference) =>
                        containsParticipationName(conference.participation, fullNameFilter),
                    );
                }

                const statusFilter = this.filters.get('status')?.value;
                if (statusFilter && statusFilter.length > 0) {
                    this.conferences = this.conferences?.filter((conference) =>
                        conference.status?.includes(statusFilter),
                    );
                }

                this.refreshConferences({page: 1, pageSize: 10});
            });
    }

    refresh(): void {
        this.filters.reset();
        this.actionFilter();
    }

    previousState(): void {
        window.history.back();
    }

    refreshConferences(event: PaginationEvent): void {
        this.conferencesPaginated = this.conferences.slice((event.page - 1) * event.pageSize,
            (event.page - 1) * event.pageSize + event.pageSize);
    }

    protected readonly getFormattedParticipationName = getFormattedParticipationName;
}
