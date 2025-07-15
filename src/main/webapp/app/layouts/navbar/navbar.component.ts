import {Component, HostListener, inject, OnInit} from '@angular/core';
import {NavigationEnd, Router, RouterModule} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';

import {StateStorageService} from 'app/core/auth/state-storage.service';
import SharedModule from 'app/shared/shared.module';
import HasAnyAuthorityDirective from 'app/shared/auth/has-any-authority.directive';
import {LANGUAGES} from 'app/config/language.constants';
import {AccountService} from 'app/core/auth/account.service';
import {LoginService} from 'app/login/login.service';
import {ProfileService} from 'app/layouts/profiles/profile.service';
import {filter, Observable, of} from 'rxjs';
import {SalonService} from '../../admin/salon/service/salon.service';
import {map} from 'rxjs/operators';
import {ISalon} from '../../admin/salon/model/salon.interface';

@Component({
    selector: 'jhi-navbar',
    templateUrl: './navbar.component.html',
    styleUrl: './navbar.component.scss',
    imports: [RouterModule, SharedModule, HasAnyAuthorityDirective]
})
export default class NavbarComponent implements OnInit {
    inProduction?: boolean;
    languages = LANGUAGES;
    openAPIEnabled?: boolean;
    account = inject(AccountService).trackCurrentAccount();
    isCollapsed = false;
    dropdowns: { [key: string]: boolean } = {admin: false, adminBusiness: true};

    idSalon: string | null = null;
    salonSelected$: Observable<ISalon | null> = of();

    toggleSidebar(): void {
        this.isCollapsed = !this.isCollapsed;
    }

    private loginService = inject(LoginService);
    private translateService = inject(TranslateService);
    private stateStorageService = inject(StateStorageService);
    private profileService = inject(ProfileService);
    private router = inject(Router);
    private salonService = inject(SalonService);

    ngOnInit(): void {
        this.profileService.getProfileInfo().subscribe(profileInfo => {
            this.inProduction = profileInfo.inProduction;
            this.openAPIEnabled = profileInfo.openAPIEnabled;
        });

        this.manageSalonUrl();
        this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
            this.manageSalonUrl();
        });
    }

    manageSalonUrl(): void {
        const match = this.router.url.match(/salons\/([^\/]+)/);
        if (match) {
            if (this.idSalon != match[1]) {
                this.idSalon = match[1];
                this.salonSelected$ = this.salonService.find(match[1]).pipe(map(result => result.body ?? null));
            }
        } else {
            this.idSalon = null;
            this.salonSelected$ = of();
        }
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
        this.dropdowns[menu] = !this.dropdowns[menu];
    }

    isMobile(): boolean {
        return window.innerWidth <= 768;
    }

    closeMobile() {
        if (this.isMobile()) {
            this.isCollapsed = true;
        }
    }
}
