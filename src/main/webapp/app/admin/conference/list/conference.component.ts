import {Component, inject, NgZone, OnInit} from '@angular/core';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {combineLatest, filter, Observable, Subscription, tap} from 'rxjs';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import {DurationPipe, FormatMediumDatePipe, FormatMediumDatetimePipe} from 'app/shared/date';
import {FormsModule} from '@angular/forms';
import {ITEM_DELETED_EVENT} from 'app/config/navigation.constants';
import {IConference} from '../conference.model';
import {ConferenceService, EntityArrayResponseType} from '../service/conference.service';
import {ConferenceDeleteDialogComponent} from '../delete/conference-delete-dialog.component';
import StatusPipe from '../../../shared/pipe/status.pipe';
import ColorStatusPipe from '../../../shared/pipe/color-status.pipe';

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
               ],
           })
export class ConferenceComponent implements OnInit {
    subscription: Subscription | null = null;
    conferences?: IConference[];
    isLoading = false;
    params: any;

    public router = inject(Router);
    protected conferenceService = inject(ConferenceService);
    protected activatedRoute = inject(ActivatedRoute);
    protected modalService = inject(NgbModal);
    protected ngZone = inject(NgZone);

    ngOnInit(): void {
        combineLatest([this.activatedRoute.paramMap, this.activatedRoute.data]).subscribe(([params, data]) => {
            this.params = params;
            if (!this.conferences || this.conferences.length === 0) {
                this.load();
            }
        });
    }

    delete(conference: IConference): void {
        const modalRef = this.modalService.open(ConferenceDeleteDialogComponent, {size: 'lg', backdrop: 'static'});
        modalRef.componentInstance.conference = conference;
        // unsubscribe not needed because closed completes on modal close
        modalRef.closed
                .pipe(
                    filter(reason => reason === ITEM_DELETED_EVENT),
                    tap(() => this.load()),
                )
                .subscribe();
    }

    load(): void {
        this.queryBackend({idSalon: this.params.get('idSalon')}).subscribe({
                                                                               next: (res: EntityArrayResponseType) => {
                                                                                   this.onResponseSuccess(res);
                                                                               },
                                                                           });
    }

    previousState(): void {
        window.history.back();
    }

    protected onResponseSuccess(response: EntityArrayResponseType): void {
        const dataFromBody = this.fillComponentAttributesFromResponseBody(response.body);
        this.conferences = dataFromBody;
    }

    protected fillComponentAttributesFromResponseBody(data: IConference[] | null): IConference[] {
        return data ?? [];
    }

    protected queryBackend(query?: any): Observable<EntityArrayResponseType> {
        this.isLoading = true;
        return this.conferenceService.query(query).pipe(tap(() => (this.isLoading = false)));
    }
}
