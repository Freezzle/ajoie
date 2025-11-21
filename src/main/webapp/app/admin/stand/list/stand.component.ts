import {Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute, ParamMap, RouterModule} from '@angular/router';
import {combineLatest, filter, switchMap, tap} from 'rxjs';

import SharedModule from 'app/shared/shared.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {IStand} from '../model/stand.interface';
import {StandService} from '../service/stand.service';
import StatusPipe from '../../../shared/pipe/status.pipe';
import ColorStatusPipe from '../../../shared/pipe/color-status.pipe';
import {formatterStatus, Status} from '../../enumerations/status.model';
import {finalize, map} from 'rxjs/operators';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {getFormattedParticipationName,} from '../../participation/model/participation.interface';
import {getFirstExhibitorName} from '../../exhibitor/model/exhibitor.interface';
import {Category, formatterCategory} from '../../enumerations/category.model';
import {copyToClipboard} from '../../../core/util/utils';
import {ProgressSpinner} from "primeng/progressspinner";
import {ConfirmDialogService} from "../../../shared/delete-dialog/confirm-dialog.service";
import {Toast} from "primeng/toast";
import {ConfirmPopup} from "primeng/confirmpopup";
import {AlertComponent} from "../../../shared/alert/alert.component";
import {AlertErrorComponent} from "../../../shared/alert/alert-error.component";
import {TableModule} from "primeng/table";
import {Tag} from "primeng/tag";
import {ContentPageComponent} from "../../../shared/components/content-page/content-page.component";
import {CardComponent} from "../../../shared/components/card/card.component";
import {IconField} from "primeng/iconfield";
import {InputIcon} from "primeng/inputicon";
import {InputText} from "primeng/inputtext";

@Component({
    selector: 'app-stand',
    templateUrl: './stand.component.html',
    imports: [
        RouterModule,
        FormsModule,
        SharedModule,
        StatusPipe,
        ColorStatusPipe,
        ReactiveFormsModule,
        ButtonBoxComponent,
        ProgressSpinner,
        Toast,
        ConfirmPopup,
        AlertComponent,
        AlertErrorComponent,
        TableModule,
        Tag,
        ContentPageComponent,
        CardComponent,
        IconField,
        InputIcon,
        InputText,
    ]
})
export class StandComponent implements OnInit {
    protected standService = inject(StandService);
    protected activatedRoute = inject(ActivatedRoute);
    protected confirmDialogService = inject(ConfirmDialogService);

    statusValues = Object.keys(Status);
    stands: IStand[] = [];
    isLoading = false;
    standardView = true;
    params!: ParamMap;

    ngOnInit(): void {
        combineLatest([this.activatedRoute.paramMap, this.activatedRoute.data]).subscribe(
            ([params, data]) => {
                this.params = params;

                if (!this.stands || this.stands.length === 0) {
                    this.load();
                }
            },
        );
    }

    delete(htmlElement: HTMLElement, stand: IStand): void {
        this.confirmDialogService.delete(htmlElement, 'stand.delete.question', {
            description: getFormattedParticipationName(stand.participation),
        }).pipe(
            filter(confirmed => confirmed),
            switchMap(() => this.standService.delete(stand.id)),
            tap(() => this.load()), // Recharge les données
        ).subscribe()
    }

    load(): void {
        this.isLoading = true;

        const queryObject: any = {
            idSalon: this.params.get('idSalon'),
            idParticipation: this.params.get('idParticipation'),
        };
        this.standService
            .query(queryObject)
            .pipe(map(stands => stands.map(stand => ({
                        ...stand,
                        fullNameFilter: getFormattedParticipationName(stand.participation)
                    }))
                ),
                finalize(() => (this.isLoading = false)))
            .subscribe((result) => {
                this.stands = result ?? [];
            });
    }

    refresh(): void {
        this.load();
    }

    previousState(): void {
        window.history.back();
    }

    clipboard(value: string | null | undefined): void {
        copyToClipboard(value);
    }

    changeTechnicalView(): void {
        this.stands.sort((a, b) => {
            const nameA = a.category ?? '';
            const nameB = b.category ?? '';

            if (nameA < nameB) {
                return -1;
            }
            if (nameA > nameB) {
                return 1;
            }

            const nameAName = a.participation?.therapistName?.toLocaleLowerCase() ?? '';
            const nameBName = b.participation?.therapistName?.toLocaleLowerCase() ?? '';

            if (nameAName < nameBName) {
                return -1;
            }
            if (nameAName > nameBName) {
                return 1;
            }
            return 0;
        });
        this.standardView = false;
    }

    protected readonly getFormattedParticipationName = getFormattedParticipationName;
    protected readonly getFirstExhibitorName = getFirstExhibitorName;
    protected readonly formatterCategory = formatterCategory;
    protected readonly formatterStatus = formatterStatus;
    protected readonly Status = Status;
    protected readonly Category = Category;
}
