import {Component, inject, OnInit, Renderer2, RendererFactory2, signal} from '@angular/core';
import {ActivatedRoute, NavigationEnd, Router, RouterOutlet} from '@angular/router';
import {filter} from 'rxjs/operators';
import {LangChangeEvent, TranslateService} from '@ngx-translate/core';
import dayjs from 'dayjs/esm';

import {AccountService} from 'app/core/auth/account.service';
import {AppPageTitleStrategy} from 'app/app-page-title-strategy';
import TopbarComponent from '../topbar/topbar.component';
import {AlertComponent} from '../../shared/alert/alert.component';

@Component({
               selector: 'app-main',
               templateUrl: './main.component.html',
               styleUrl: './main.component.scss',
               providers: [AppPageTitleStrategy],
               imports: [RouterOutlet, TopbarComponent, AlertComponent]
           })
export default class MainComponent implements OnInit {
    readonly inDevelopementMode = signal<boolean>(false);
    /** Les pages publiques (ex. le stepper d'inscription) s'affichent sans le chrome applicatif. */
    readonly isPublicLayout = signal<boolean>(false);
    private renderer: Renderer2;
    private router = inject(Router);
    private activatedRoute = inject(ActivatedRoute);
    private appPageTitleStrategy = inject(AppPageTitleStrategy);
    private accountService = inject(AccountService);
    private translateService = inject(TranslateService);
    private rootRenderer = inject(RendererFactory2);

    constructor() {
        this.renderer = this.rootRenderer.createRenderer(document.querySelector('html'), null);
    }

    ngOnInit(): void {
        this.accountService.identity().subscribe();
        this.inDevelopementMode.set(false);

        this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
            this.isPublicLayout.set(this.resolvePublicLayout());
        });
        this.isPublicLayout.set(this.resolvePublicLayout());

        this.translateService.onLangChange.subscribe((langChangeEvent: LangChangeEvent) => {
            this.appPageTitleStrategy.updateTitle(this.router.routerState.snapshot);
            dayjs.locale(langChangeEvent.lang);
            this.renderer.setAttribute(document.querySelector('html'), 'lang', langChangeEvent.lang);
        });
    }

    private resolvePublicLayout(): boolean {
        let route = this.activatedRoute.snapshot;
        let publicLayout = false;

        while (route) {
            publicLayout = publicLayout || route.data['publicLayout'] === true;
            route = route.firstChild as typeof route;
        }

        return publicLayout;
    }
}
