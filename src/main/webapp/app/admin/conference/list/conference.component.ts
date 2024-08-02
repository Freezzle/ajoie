import { Component, NgZone, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Data, ParamMap, Router, RouterModule } from '@angular/router';
import { combineLatest, filter, Observable, Subscription, tap } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { DurationPipe, FormatMediumDatetimePipe, FormatMediumDatePipe } from 'app/shared/date';
import { FormsModule } from '@angular/forms';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';
import { IConference } from '../conference.model';
import { EntityArrayResponseType, ConferenceService } from '../service/conference.service';
import { ConferenceDeleteDialogComponent } from '../delete/conference-delete-dialog.component';

@Component({
  standalone: true,
  selector: 'jhi-conference',
  templateUrl: './conference.component.html',
  imports: [RouterModule, FormsModule, SharedModule, DurationPipe, FormatMediumDatetimePipe, FormatMediumDatePipe],
})
export class ConferenceComponent implements OnInit {
  subscription: Subscription | null = null;
  conferences?: IConference[];
  isLoading = false;

  public router = inject(Router);
  protected state: any;
  protected conferenceService = inject(ConferenceService);
  protected activatedRoute = inject(ActivatedRoute);
  protected modalService = inject(NgbModal);
  protected ngZone = inject(NgZone);

  trackId = (_index: number, item: IConference): string => this.conferenceService.getConferenceIdentifier(item);

  ngOnInit(): void {
    this.state = history.state;
    if (!this.conferences || this.conferences.length === 0) {
      this.load();
    }
  }

  delete(conference: IConference): void {
    const modalRef = this.modalService.open(ConferenceDeleteDialogComponent, { size: 'lg', backdrop: 'static' });
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
    const dataFromBody = this.fillComponentAttributesFromResponseBody(response.body);
    this.conferences = dataFromBody;
  }

  protected fillComponentAttributesFromResponseBody(data: IConference[] | null): IConference[] {
    return data ?? [];
  }

  protected queryBackend(): Observable<EntityArrayResponseType> {
    this.isLoading = true;
    const queryObject: any = {
      idSalon: this.state.idSalon,
    };
    return this.conferenceService.query(queryObject).pipe(tap(() => (this.isLoading = false)));
  }
}
