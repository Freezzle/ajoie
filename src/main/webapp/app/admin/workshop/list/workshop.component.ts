import {ChangeDetectionStrategy, Component, inject, OnInit, signal} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {filter, switchMap, tap} from 'rxjs';
import {finalize} from 'rxjs/operators';

import {ConfirmDialogService} from 'app/shared/delete-dialog/confirm-dialog.service';
import {TalkListComponent} from '../../common/talk-list/talk-list.component';
import {ITalk} from '../../common/talk-list/talk-list.model';
import {IWorkshop} from '../model/workshop.interface';
import {WorkshopService} from '../service/workshop.service';

@Component({
               selector: 'app-workshop',
               imports: [TalkListComponent],
               templateUrl: './workshop.component.html',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class WorkshopComponent implements OnInit {
    readonly workshops = signal<IWorkshop[]>([]);
    readonly isLoading = signal<boolean>(false);
    readonly idSalon = signal<string | null>(null);
    readonly idParticipation = signal<string | null>(null);

    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly workshopService = inject(WorkshopService);
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

        this.workshopService
            .query({idSalon: this.idSalon(), idParticipation: this.idParticipation()})
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe(result => this.workshops.set(result ?? []));
    }

    delete(target: HTMLElement, workshop: ITalk): void {
        this.confirmDialogService.delete(target, 'workshop.delete.question', {title: workshop.title})
            .pipe(
                filter(confirmed => confirmed),
                switchMap(() => this.workshopService.delete(workshop.id)),
                tap(() => this.load())
            )
            .subscribe();
    }
}
