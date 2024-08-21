import {Component, inject, NgZone, OnInit} from '@angular/core';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {combineLatest, filter, Observable, Subscription, tap} from 'rxjs';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import {SortByDirective, SortDirective, SortService} from 'app/shared/sort';
import {DurationPipe, FormatMediumDatePipe, FormatMediumDatetimePipe} from 'app/shared/date';
import {FormsModule} from '@angular/forms';
import {ITEM_DELETED_EVENT} from 'app/config/navigation.constants';
import {IStand} from '../stand.model';
import {EntityArrayResponseType, StandService} from '../service/stand.service';
import {StandDeleteDialogComponent} from '../delete/stand-delete-dialog.component';
import {Location} from '@angular/common';
import StatusPipe from '../../../shared/pipe/status.pipe';
import ColorStatusPipe from '../../../shared/pipe/color-status.pipe';

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
               ],
           })
export class StandComponent implements OnInit {
    subscription: Subscription | null = null;
    stands?: IStand[];
    isLoading = false;
    params: any;

    public router = inject(Router);
    protected location = inject(Location);
    protected standService = inject(StandService);
    protected activatedRoute = inject(ActivatedRoute);
    protected sortService = inject(SortService);
    protected modalService = inject(NgbModal);
    protected ngZone = inject(NgZone);

    ngOnInit(): void {
        combineLatest([this.activatedRoute.paramMap, this.activatedRoute.data]).subscribe(([params, data]) => {
            this.params = params;
            if (!this.stands || this.stands.length === 0) {
                this.load();
            }
        });
    }

    delete(stand: IStand): void {
        const modalRef = this.modalService.open(StandDeleteDialogComponent, {size: 'lg', backdrop: 'static'});
        modalRef.componentInstance.stand = stand;
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

    protected onResponseSuccess(response: EntityArrayResponseType): void {
        this.stands = this.fillComponentAttributesFromResponseBody(response.body);
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
