import {ChangeDetectionStrategy, Component, inject, OnInit, signal} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {filter, switchMap, tap} from 'rxjs';
import {finalize} from 'rxjs/operators';

import {ConfirmDialogService} from 'app/shared/delete-dialog/confirm-dialog.service';
import {TalkListComponent} from '../../common/talk-list/talk-list.component';
import {ITalk} from '../../common/talk-list/talk-list.model';
import {IConference} from '../model/conference.interface';
import {ConferenceService} from '../service/conference.service';

@Component({
               selector: 'app-conference',
               imports: [TalkListComponent],
               templateUrl: './conference.component.html',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class ConferenceComponent implements OnInit {
    readonly conferences = signal<IConference[]>([]);
    readonly isLoading = signal<boolean>(false);
    readonly idSalon = signal<string | null>(null);
    readonly idParticipation = signal<string | null>(null);

    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly conferenceService = inject(ConferenceService);
    private readonly confirmDialogService = inject(ConfirmDialogService);

    ngOnInit(): void {
        this.activatedRoute.paramMap.subscribe(params => {
            this.idSalon.set(params.get('idSalon'));
            this.idParticipation.set(params.get('idParticipation'));

            this.load();
        });
    }

    load(): void {
        this.isLoading.set(true);

        this.conferenceService
            .query({idSalon: this.idSalon(), idParticipation: this.idParticipation()})
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe(result => this.conferences.set(result ?? []));
    }

    delete(target: HTMLElement, conference: ITalk): void {
        this.confirmDialogService.delete(target, 'conference.delete.question', {title: conference.title})
            .pipe(
                filter(confirmed => confirmed),
                switchMap(() => this.conferenceService.delete(conference.id)),
                tap(() => this.load())
            )
            .subscribe();
    }
}
