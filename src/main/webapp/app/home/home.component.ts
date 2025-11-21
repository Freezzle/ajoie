import {Component, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {RouterModule} from '@angular/router';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import SharedModule from 'app/shared/shared.module';
import {AccountService} from 'app/core/auth/account.service';
import {Account} from 'app/core/auth/account.model';
import {ContentPageComponent} from "../shared/components/content-page/content-page.component";
import {CardComponent} from "../shared/components/card/card.component";

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss',
    imports: [SharedModule, RouterModule, ContentPageComponent, CardComponent]
})
export default class HomeComponent implements OnInit, OnDestroy {
    account = signal<Account | null>(null);

    private readonly destroy$ = new Subject<void>();

    private accountService = inject(AccountService);

    ngOnInit(): void {
        this.accountService
            .getAuthenticationState()
            .pipe(takeUntil(this.destroy$))
            .subscribe(account => this.account.set(account));
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
