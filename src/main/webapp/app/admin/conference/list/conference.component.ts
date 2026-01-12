import {Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute, ParamMap, RouterModule} from '@angular/router';
import {combineLatest, filter, switchMap, tap} from 'rxjs';

import SharedModule from 'app/shared/shared.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {IConference} from '../model/conference.interface';
import {ConferenceService} from '../service/conference.service';
import StatusPipe from '../../../shared/pipe/status.pipe';
import ColorStatusPipe from '../../../shared/pipe/color-status.pipe';
import {Status} from '../../enumerations/status.model';
import {ConferenceFormService} from '../service/conference-form.service';
import {finalize, map} from 'rxjs/operators';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {getFormattedParticipationName} from '../../participation/model/participation.interface';
import {AlertErrorComponent} from '../../../shared/alert/alert-error.component';
import {ConfirmDialogService} from '../../../shared/delete-dialog/confirm-dialog.service';
import {Toast} from 'primeng/toast';
import {ConfirmPopup} from 'primeng/confirmpopup';
import {AlertComponent} from '../../../shared/alert/alert.component';
import {TableModule} from 'primeng/table';
import {ContentPageComponent} from '../../../shared/components/content-page/content-page.component';
import {CardComponent} from '../../../shared/components/card/card.component';
import {IconField} from 'primeng/iconfield';
import {InputIcon} from 'primeng/inputicon';
import {InputText} from 'primeng/inputtext';
import {MultiSelect} from 'primeng/multiselect';

@Component({
               selector: 'app-conference',
               templateUrl: './conference.component.html',
               imports: [
                   RouterModule,
                   FormsModule,
                   SharedModule,
                   StatusPipe,
                   ColorStatusPipe,
                   ReactiveFormsModule,
                   ButtonBoxComponent,
                   AlertErrorComponent,
                   Toast,
                   ConfirmPopup,
                   AlertComponent,
                   TableModule,
                   ContentPageComponent,
                   CardComponent,
                   IconField,
                   InputIcon,
                   InputText,
                   MultiSelect
               ]
           })
export class ConferenceComponent implements OnInit {
    conferences: IConference[] = [];
    isLoading = false;
    params!: ParamMap;
    statusValues = Object.keys(Status);
    protected activatedRoute = inject(ActivatedRoute);
    protected conferenceService = inject(ConferenceService);
    protected conferenceFormService = inject(ConferenceFormService);
    protected confirmDialogService = inject(ConfirmDialogService);
    protected readonly getFormattedParticipationName = getFormattedParticipationName;

    ngOnInit(): void {
        combineLatest([this.activatedRoute.paramMap, this.activatedRoute.data]).subscribe(
            ([params, data]) => {
                this.params = params;

                if (!this.conferences || this.conferences.length === 0) {
                    this.load();
                }
            }
        );
    }

    delete(htmlElement: HTMLElement, conference: IConference): void {
        this.confirmDialogService.delete(htmlElement, 'conference.delete.question', {title: conference.title})
            .pipe(
                filter(confirmed => confirmed),
                switchMap(() => this.conferenceService.delete(conference.id)),
                tap(() => this.load())
            )
            .subscribe();
    }

    load(): void {
        this.isLoading = true;

        const queryObject: any = {
            idSalon: this.params.get('idSalon'),
            idParticipation: this.params.get('idParticipation')
        };

        this.conferenceService
            .query(queryObject)
            .pipe(map(conferences => conferences.map(conference => ({
                          ...conference,
                          fullNameFilter: getFormattedParticipationName(conference.participation)
                      }))
                  ),
                  finalize(() => (this.isLoading = false)))
            .subscribe((result) => {
                this.conferences = result ?? [];
            });
    }

    refresh(): void {
        this.load();
    }

    previousState(): void {
        window.history.back();
    }
}
