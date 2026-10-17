import {EnvironmentProviders, inject, Provider, provideAppInitializer} from '@angular/core';
import {provideMissingTranslationHandler, provideTranslateService, TranslateService} from '@ngx-translate/core';
import {provideTranslateHttpLoader} from '@ngx-translate/http-loader';
import {MissingTranslationHandlerImpl} from 'app/config/translation.config';
import {StateStorageService} from 'app/core/auth/state-storage.service';

export function provideTranslation(): (Provider | EnvironmentProviders)[] {
    return [
        provideTranslateService({
                                    loader: provideTranslateHttpLoader({
                                                                           prefix: 'i18n/',
                                                                           suffix: `.json?_=${I18N_HASH}`
                                                                       }),
                                    missingTranslationHandler: provideMissingTranslationHandler(MissingTranslationHandlerImpl)
                                }),
        // The languages are deliberately selected here instead of through the `lang`/`fallbackLang`
        // options of `provideTranslateService`: those options make the `TranslateService`
        // constructor issue its HTTP request while the service itself is still being constructed.
        // Building the HTTP interceptor chain for that request instantiates services that inject
        // `TranslateService` back (Router -> TitleStrategy -> AppPageTitleStrategy,
        // AuthExpiredInterceptor -> LoginService -> AccountService), which closes a DI cycle and
        // makes bootstrap fail with NG0200. Loading from an initializer keeps the service fully
        // constructed before the first request is issued.
        provideAppInitializer(() => {
            const translateService = inject(TranslateService);
            // if user have changed language and navigates away from the application and back to the application then use previously choosed language
            const langKey = inject(StateStorageService).getLocale() ?? 'fr';
            translateService.setFallbackLang('fr');
            translateService.use(langKey);
        })
    ];
}
