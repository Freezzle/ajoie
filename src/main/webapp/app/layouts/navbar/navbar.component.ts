import {Component, ElementRef, HostListener, inject, OnInit, signal, ViewChild} from '@angular/core';
import {NavigationEnd, Router, RouterModule} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';

import {StateStorageService} from 'app/core/auth/state-storage.service';
import SharedModule from 'app/shared/shared.module';
import HasAnyAuthorityDirective from 'app/shared/auth/has-any-authority.directive';
import {LANGUAGES} from 'app/config/language.constants';
import {AccountService} from 'app/core/auth/account.service';
import {LoginService} from 'app/login/login.service';
import {filter} from 'rxjs';
import {SalonService} from '../../admin/salon/service/salon.service';
import {map} from 'rxjs/operators';
import {NavigationStateService} from "./navigation-state.service";
import {PresenceComponent} from "../../admin/presence/component/presence.component";

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrl: './navbar.component.scss',
    imports: [RouterModule, SharedModule, HasAnyAuthorityDirective, PresenceComponent]
})
export default class NavbarComponent implements OnInit {
    @ViewChild('sidebar', {static: true}) sidebar!: ElementRef<HTMLElement>;

    languages = LANGUAGES;
    account = inject(AccountService).trackCurrentAccount();
    navigationService = inject(NavigationStateService);
    isCollapsed = signal(false);
    dropdowns = signal<{ [key: string]: boolean }>({admin: false, adminBusiness: true});

    private loginService = inject(LoginService);
    private translateService = inject(TranslateService);
    private stateStorageService = inject(StateStorageService);
    private router = inject(Router);
    private salonService = inject(SalonService);

    ngOnInit(): void {

        this.manageSalonUrl();
        this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
            this.manageSalonUrl();
        });
    }

    manageSalonUrl(): void {
        const match = this.router.url.match(/salons\/([^/]+)/);
        if (match) {
            if (!this.navigationService.isSameContext(match[1])) {
                this.salonService.find(match[1])
                    .pipe(map(result => result.body!))
                    .subscribe(res => this.navigationService.defineSalon(res));
            }
        } else {
            this.navigationService.reset();
        }
    }

    toggleSidebar(): void {
        this.isCollapsed.update(v => !v);
    }

    changeLanguage(languageKey: string): void {
        this.stateStorageService.storeLocale(languageKey);
        this.translateService.use(languageKey);
    }

    login(): void {
        this.router.navigate(['/login']);
    }

    logout(): void {
        this.loginService.logout();
        this.router.navigate(['']);
    }

    toggleDropdown(menu: string) {
        this.dropdowns.update(d => ({
            ...d,
            [menu]: !d[menu],
        }));
    }

    isMobile(): boolean {
        return window.innerWidth <= 768;
    }

    closeMobile() {
        if (this.isMobile()) {
            this.isCollapsed.set(true);
        }
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        if (!this.isMobile() || this.isCollapsed()) {
            return;
        }

        const target = event.target as Node | null;
        if (!target || !this.sidebar) {return;}

        const clickedInside = this.sidebar.nativeElement.contains(target);

        if (!clickedInside) {
            this.closeMobile();
        }
    }
}
