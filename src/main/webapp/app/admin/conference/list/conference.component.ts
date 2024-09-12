import {Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute, RouterModule} from '@angular/router';
import {combineLatest, filter, switchMap, tap} from 'rxjs';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import {DurationPipe, FormatMediumDatePipe, FormatMediumDatetimePipe} from 'app/shared/date';
import {FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ITEM_DELETED_EVENT} from 'app/config/navigation.constants';
import {IConference} from '../conference.model';
import {ConferenceService} from '../service/conference.service';
import StatusPipe from '../../../shared/pipe/status.pipe';
import ColorStatusPipe from '../../../shared/pipe/color-status.pipe';
import {Status} from '../../enumerations/status.model';
import {ConferenceFilterFormGroup, ConferenceFormService} from '../update/conference-form.service';
import {DeleteDialogComponent} from '../../../shared/delete-dialog/delete-dialog.component';
import {finalize} from 'rxjs/operators';

@Component({
    standalone: true,
    selector: 'jhi-conference',
    templateUrl: './conference.component.html',
    imports: [
        RouterModule,
        FormsModule,
        SharedModule,
        DurationPipe,
        FormatMediumDatetimePipe,
        FormatMediumDatePipe,
        StatusPipe,
        ColorStatusPipe,
        ReactiveFormsModule,
    ],
})
export class ConferenceComponent implements OnInit {
    protected activatedRoute = inject(ActivatedRoute);
    protected modalService = inject(NgbModal);
    protected conferenceService = inject(ConferenceService);
    protected conferenceFormService = inject(ConferenceFormService);

    conferences?: IConference[];
    isLoading = false;
    params: any;
    statusValues = Object.keys(Status);
    filters: FormGroup<ConferenceFilterFormGroup> = this.conferenceFormService.createFilterFormGroup();

    ngOnInit(): void {
        combineLatest([this.activatedRoute.paramMap, this.activatedRoute.data]).subscribe(([params, data]) => {
            this.params = params;

            if (!this.conferences || this.conferences.length === 0) {
                this.actionFilter();
            }
        });
    }

    delete(conference: IConference): void {
        const modalRef = this.modalService.open(DeleteDialogComponent, {size: 'lg', backdrop: 'static'});
        modalRef.componentInstance.translateKey = 'conference.delete.question';
        modalRef.componentInstance.translateValues = {title: conference.title};

        modalRef.closed
            .pipe(
                filter(reason => reason === ITEM_DELETED_EVENT),
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
            .subscribe(result => {
                this.conferences = result.body ?? [];

                const fullNameFilter = this.filters.get('fullName')?.value;
                if (fullNameFilter && fullNameFilter.length > 0) {
                    this.conferences = this.conferences?.filter(conference =>
                        conference.participation?.exhibitor?.fullName?.toLocaleLowerCase()
                            .includes(fullNameFilter.toLocaleLowerCase()),
                    );
                }
                const statusFilter = this.filters.get('status')?.value;
                if (statusFilter && statusFilter.length > 0) {
                    this.conferences = this.conferences?.filter(
                        conference => conference.status?.includes(statusFilter));
                }
            });
    }

    refresh(): void {
        this.filters.reset();
        this.actionFilter();
    }

    previousState(): void {
        window.history.back();
    }
}
