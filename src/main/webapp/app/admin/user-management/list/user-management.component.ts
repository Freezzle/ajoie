import {Component, inject, OnInit, signal} from '@angular/core';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {HttpHeaders, HttpResponse} from '@angular/common/http';
import {combineLatest, switchMap} from 'rxjs';

import SharedModule from 'app/shared/shared.module';
import {SortByDirective, SortDirective, SortService, SortState, sortStateSignal} from 'app/shared/sort';
import {ITEMS_PER_PAGE} from 'app/config/pagination.constants';
import {SORT} from 'app/config/navigation.constants';
import {ItemCountComponent} from 'app/shared/pagination';
import {AccountService} from 'app/core/auth/account.service';
import {UserManagementService} from '../service/user-management.service';
import {User} from '../user-management.model';
import {filter, tap} from 'rxjs/operators';
import CheckBoolPipe from '../../../shared/pipe/check-boolean.pipe';
import ColorBoolPipe from '../../../shared/pipe/color-boolean.pipe';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {LinkBoxComponent} from '../../../shared/components/link-box/link-box.component';
import {AlertErrorComponent} from '../../../shared/alert/alert-error.component';

import {ConfirmDialogService} from '../../../shared/delete-dialog/confirm-dialog.service';

@Component({
               selector: 'app-user-mgmt',
               templateUrl: './user-management.component.html',
               imports: [
                   RouterModule,
                   SharedModule,
                   SortDirective,
                   SortByDirective,
                   ItemCountComponent,
                   CheckBoolPipe,
                   ColorBoolPipe,
                   ButtonBoxComponent,
                   LinkBoxComponent,
                   AlertErrorComponent
               ]
           })
export default class UserManagementComponent implements OnInit {
    currentAccount = inject(AccountService).trackCurrentAccount();
    users = signal<User[] | null>(null);
    isLoading = signal(false);
    totalItems = signal(0);
    itemsPerPage = ITEMS_PER_PAGE;
    page!: number;
    sortState = sortStateSignal({});

    private userService = inject(UserManagementService);
    private activatedRoute = inject(ActivatedRoute);
    private router = inject(Router);
    private sortService = inject(SortService);
    private confirmDialogService = inject(ConfirmDialogService);

    ngOnInit(): void {
        this.handleNavigation();
    }

    previousState(): void {
        window.history.back();
    }

    setActive(user: User, isActivated: boolean): void {
        this.userService.update({...user, activated: isActivated}).subscribe(() => this.load());
    }

    trackIdentity(_index: number, item: User): number {
        return item.id!;
    }

    deleteUser(event: HTMLElement, user: User): void {
        this.confirmDialogService.delete(event, 'userManagement.delete.question', {login: user.login}).pipe(
            filter(confirmed => confirmed),
            switchMap(() => this.userService.delete(user.login)),
            tap(() => this.load()) // Recharge les données
        ).subscribe();
    }

    load(): void {
        this.isLoading.set(true);
        this.userService
            .query({
                       page: this.page - 1,
                       size: this.itemsPerPage,
                       sort: this.sortService.buildSortParam(this.sortState(), 'id')
                   })
            .subscribe({
                           next: (res: HttpResponse<User[]>) => {
                               this.isLoading.set(false);
                               this.onSuccess(res.body, res.headers);
                           },
                           error: () => this.isLoading.set(false)
                       });
    }

    transition(sortState?: SortState): void {
        this.router.navigate(['./'], {
            relativeTo: this.activatedRoute.parent,
            queryParams: {
                page: this.page,
                sort: this.sortService.buildSortParam(sortState ?? this.sortState())
            }
        });
    }

    private handleNavigation(): void {
        combineLatest([this.activatedRoute.data, this.activatedRoute.queryParamMap]).subscribe(([data, params]) => {
            const page = params.get('page');
            this.page = +(page ?? 1);
            this.sortState.set(this.sortService.parseSortParam(params.get(SORT) ?? data['defaultSort']));
            this.load();
        });
    }

    private onSuccess(users: User[] | null, headers: HttpHeaders): void {
        this.totalItems.set(Number(headers.get('X-Total-Count')));
        this.users.set(users);
    }
}
