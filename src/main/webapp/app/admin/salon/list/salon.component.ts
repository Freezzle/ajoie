import {Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {filter, switchMap, tap} from 'rxjs';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import {FormatMediumDatePipe} from 'app/shared/date';
import {FormsModule} from '@angular/forms';
import {ITEM_DELETED_EVENT} from 'app/config/navigation.constants';
import {ISalon} from '../model/salon.interface';
import {SalonService} from '../service/salon.service';
import {DeleteDialogComponent} from '../../../shared/delete-dialog/delete-dialog.component';
import {finalize} from 'rxjs/operators';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {LinkBoxComponent} from '../../../shared/components/link-box/link-box.component';
import {PaginationComponent} from '../../../shared/pagination/pagination.component';
import {PaginationEvent} from '../../../shared/pagination/pagination-event.interface';
import {AlertErrorComponent} from "../../../shared/alert/alert-error.component";
import {AlertComponent} from "../../../shared/alert/alert.component";
import {ProgressSpinner} from "primeng/progressspinner";

@Component({
    selector: 'jhi-salon',
    templateUrl: './salon.component.html',
    imports: [
        RouterModule,
        FormsModule,
        SharedModule,
        FormatMediumDatePipe,
        ButtonBoxComponent,
        LinkBoxComponent,
        PaginationComponent,
        AlertErrorComponent,
        AlertComponent,
        ProgressSpinner,
    ]
})
export class SalonComponent implements OnInit {
    public router = inject(Router);
    protected salonService = inject(SalonService);
    protected activatedRoute = inject(ActivatedRoute);
    protected modalService = inject(NgbModal);

    salonsPaginated: ISalon[] = [];
    salons: ISalon[] = [];
    isLoading = false;

    ngOnInit(): void {
        if (!this.salons || this.salons.length === 0) {
            this.load();
        }
    }

    delete(salon: ISalon): void {
        const modalRef = this.modalService.open(DeleteDialogComponent, {
            size: 'lg',
            backdrop: 'static',
        });
        modalRef.componentInstance.translateKey = 'salon.delete.question';
        modalRef.componentInstance.translateValues = {id: salon.place};

        modalRef.closed
            .pipe(
                filter((reason) => reason === ITEM_DELETED_EVENT),
                switchMap(() => this.salonService.delete(salon.id)),
                tap(() => this.load()), // Recharge les données
            )
            .subscribe();
    }

    load(): void {
        this.isLoading = true;

        this.salonService
            .query()
            .pipe(finalize(() => (this.isLoading = false)))
            .subscribe((result) => {
                this.salons = result.body ?? [];
            });
    }

    previousState(): void {
        window.history.back();
    }

    refreshSalons(event: PaginationEvent): void {
        this.salonsPaginated = this.salons.slice((event.page - 1) * event.pageSize,
            (event.page - 1) * event.pageSize + event.pageSize);
    }
}
