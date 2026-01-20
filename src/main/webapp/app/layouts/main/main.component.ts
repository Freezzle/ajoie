import {Component, inject, OnInit, Renderer2, RendererFactory2, signal} from '@angular/core';
import {Router, RouterOutlet} from '@angular/router';
import {LangChangeEvent, TranslateService} from '@ngx-translate/core';
import dayjs from 'dayjs/esm';

import {AccountService} from 'app/core/auth/account.service';
import {AppPageTitleStrategy} from 'app/app-page-title-strategy';
import TopbarComponent from '../topbar/topbar.component';

@Component({
               selector: 'app-main',
               templateUrl: './main.component.html',
               styleUrl: './main.component.scss',
               providers: [AppPageTitleStrategy],
               imports: [RouterOutlet, TopbarComponent]
           })
export default class MainComponent implements OnInit {
    readonly inDevelopementMode = signal<boolean>(false);
    private renderer: Renderer2;
    private router = inject(Router);
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

        this.translateService.onLangChange.subscribe((langChangeEvent: LangChangeEvent) => {
            this.appPageTitleStrategy.updateTitle(this.router.routerState.snapshot);
            dayjs.locale(langChangeEvent.lang);
            this.renderer.setAttribute(document.querySelector('html'), 'lang', langChangeEvent.lang);
        });
    }
}
