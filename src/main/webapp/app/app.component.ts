import {Component, inject} from '@angular/core';
import {registerLocaleData} from '@angular/common';
import {FaIconLibrary} from '@fortawesome/angular-fontawesome';
import locale from '@angular/common/locales/fr';
import {ApplicationConfigService} from 'app/core/config/application-config.service';
import {fontAwesomeIcons} from './config/font-awesome-icons';
import MainComponent from './layouts/main/main.component';

@Component({
    selector: 'app-app',
    template: '<app-main></app-main>',
    imports: [
        MainComponent,
    ]
})
export default class AppComponent {
    private applicationConfigService = inject(ApplicationConfigService);
    private iconLibrary = inject(FaIconLibrary);

    constructor() {
        this.applicationConfigService.setEndpointPrefix(SERVER_API_URL);
        registerLocaleData(locale);
        this.iconLibrary.addIcons(...fontAwesomeIcons);
    }
}
