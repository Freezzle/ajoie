import {EnvironmentProviders, inject, Provider, provideAppInitializer} from '@angular/core';
import {provideMissingTranslationHandler, provideTranslateService, TranslateService} from '@ngx-translate/core';
import {provideTranslateHttpLoader} from '@ngx-translate/http-loader';
import {MissingTranslationHandlerImpl} from 'app/config/translation.config';
import {StateStorageService} from 'app/core/auth/state-storage.service';

export function provideTranslation(): (Provider | EnvironmentProviders)[] {
    return [
        provideTranslateService({
                                    fallbackLang: 'fr',
                                    loader: provideTranslateHttpLoader({
                                                                           prefix: 'i18n/',
                                                                           suffix: `.json?_=${I18N_HASH}`
                                                                       }),
                                    missingTranslationHandler: provideMissingTranslationHandler(MissingTranslationHandlerImpl)
                                }),
        // if user have changed language and navigates away from the application and back to the application then use previously choosed language
        provideAppInitializer(() => {
            const translateService = inject(TranslateService);
            const langKey = inject(StateStorageService).getLocale() ?? 'fr';
            translateService.use(langKey);
        })
    ];
}
