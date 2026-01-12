import {ApplicationConfig, importProvidersFrom, inject, LOCALE_ID} from '@angular/core';
import {BrowserModule, Title} from '@angular/platform-browser';
import {
    NavigationError,
    provideRouter,
    Router,
    RouterFeatures,
    TitleStrategy,
    withComponentInputBinding,
    withNavigationErrorHandler
} from '@angular/router';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import './config/dayjs';
import {TranslationModule} from 'app/shared/language/translation.module';
import {httpInterceptorProviders} from './core/interceptor';
import routes from './app.routes';
import {AppPageTitleStrategy} from './app-page-title-strategy';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {providePrimeNG} from 'primeng/config';
import Material from '@primeuix/themes/material';
import {ConfirmationService, MessageService} from 'primeng/api';
import {definePreset, palette} from '@primeuix/themes';

const routerFeatures: Array<RouterFeatures> = [
    withComponentInputBinding(),
    withNavigationErrorHandler((e: NavigationError) => {
        const router = inject(Router);
        if (e.error.status === 403) {
            router.navigate(['/accessdenied']);
        } else if (e.error.status === 404) {
            router.navigate(['/404']);
        } else if (e.error.status === 401) {
            router.navigate(['/login']);
        } else {
            router.navigate(['/error']);
        }
    })
];

// Surfaces (light) : on force quelques niveaux clés (border/text)
const surfaceLight = {
    0: '#ffffff',
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#dddddd',  // ton --app-border
    300: '#cccccc',
    400: '#b3b3b3',
    500: '#999999',
    600: '#777777',
    700: '#575757',  // ton --app-text
    800: '#3a3a3a',
    900: '#222222',
    950: '#111111'
};

export const MyPreset = definePreset(Material, {
    primitive: {
        green: palette('#83ca1a'),
        orange: palette('#e89d0e'),
        red: palette('#fd7658')
    },
    semantic: {
        primary: palette('#325d88'),

        colorScheme: {
            light: {
                surface: surfaceLight,

                // mapping explicite des états du primary
                primary: {
                    color: '{primary.500}',
                    inverseColor: '#ffffff',
                    hoverColor: '{primary.600}',
                    activeColor: '{primary.700}'
                },

                // ton "muted" -> highlight (sélections, etc.)
                semantic: {
                    highlight: {
                        background: '#ffeecc',   // ton --app-surface-muted
                        focusBackground: '#ffeecc',
                        color: '{surface.700}',
                        focusColor: '{surface.700}'
                    }
                }
            }
        }
    }
});

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes, ...routerFeatures),
        importProvidersFrom(BrowserModule),
        // Set this to true to enable service worker (PWA)
        importProvidersFrom(TranslationModule),
        provideHttpClient(withInterceptorsFromDi()),
        provideAnimationsAsync(),
        providePrimeNG({
                           theme: {
                               preset: MyPreset,
                               options: {
                                   darkModeSelector: false
                               }
                           }
                       }),
        MessageService,
        ConfirmationService,
        Title,
        {provide: LOCALE_ID, useValue: 'fr'},
        httpInterceptorProviders,
        {provide: TitleStrategy, useClass: AppPageTitleStrategy}
    ]
};