import {Component, inject, NgZone, OnInit} from '@angular/core';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {combineLatest, filter, Observable, Subscription, tap} from 'rxjs';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import {SortByDirective, SortDirective, SortService} from 'app/shared/sort';
import {DurationPipe, FormatMediumDatePipe, FormatMediumDatetimePipe} from 'app/shared/date';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ITEM_DELETED_EVENT} from 'app/config/navigation.constants';
import {IParticipation} from '../participation.model';
import {EntityArrayResponseType, ParticipationService} from '../service/participation.service';
import {ParticipationDeleteDialogComponent} from '../delete/participation-delete-dialog.component';
import ColorStatusPipe from '../../../shared/pipe/color-status.pipe';
import StatusPipe from '../../../shared/pipe/status.pipe';
import CheckBoolPipe from '../../../shared/pipe/check-boolean.pipe';
import ColorBoolPipe from '../../../shared/pipe/color-boolean.pipe';
import FilterComponent from '../../../shared/filter/filter.component';
import {Status} from '../../enumerations/status.model';

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
    subscription: Subscription | null = null;
    participations?: IParticipation[];
    isLoading = false;
    statusValues = Object.keys(Status);
    params: any;

    public router = inject(Router);
    protected participationService = inject(ParticipationService);
    protected activatedRoute = inject(ActivatedRoute);
    protected sortService = inject(SortService);
    protected modalService = inject(NgbModal);
    protected ngZone = inject(NgZone);

    ngOnInit(): void {
        combineLatest([this.activatedRoute.paramMap, this.activatedRoute.data]).subscribe(([params, data]) => {
            this.params = params;
            if (!this.participations || this.participations.length === 0) {
                this.load();
            }
        });
    }

    delete(participation: IParticipation): void {
        const modalRef = this.modalService.open(ParticipationDeleteDialogComponent, {size: 'lg', backdrop: 'static'});
        modalRef.componentInstance.participation = participation;
        // unsubscribe not needed because closed completes on modal close
        modalRef.closed
                .pipe(
                    filter(reason => reason === ITEM_DELETED_EVENT),
                    tap(() => this.load()),
                )
                .subscribe();
    }

    load(): void {
        this.queryBackend().subscribe({
                                          next: (res: EntityArrayResponseType) => {
                                              this.onResponseSuccess(res);
                                          },
                                      });
    }

    previousState(): void {
        window.history.back();
    }

    filteringExhibitor(event: any): void {
        if (event.target.value) {
            this.participations = this.participations?.filter(participation =>
                                                                  participation.exhibitor?.fullName?.toLocaleLowerCase()
                                                                               .includes(
                                                                                   event.target.value.toLocaleLowerCase()),
            );
        } else {
            this.load();
        }
    }

    filteringStatus(event: any): void {
        if (event.target.value) {
            this.participations = this.participations?.filter(
                participation => participation.status?.includes(event.target.value));
        } else {
            this.load();
        }
    }

    protected onResponseSuccess(response: EntityArrayResponseType): void {
        const dataFromBody = this.fillComponentAttributesFromResponseBody(response.body);
        this.participations = dataFromBody;
    }

    protected fillComponentAttributesFromResponseBody(data: IParticipation[] | null): IParticipation[] {
        return data ?? [];
    }

    protected queryBackend(): Observable<EntityArrayResponseType> {
        this.isLoading = true;
        return this.participationService.query(this.params.get('idSalon')).pipe(tap(() => (this.isLoading = false)));
    }
}
