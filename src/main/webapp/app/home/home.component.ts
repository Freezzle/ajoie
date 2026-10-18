import {Component} from '@angular/core';

import SharedModule from 'app/shared/shared.module';
import {RegistrationCardComponent} from 'app/registration/registration-card/registration-card.component';

@Component({
               selector: 'app-home',
               imports: [SharedModule, RegistrationCardComponent],
               templateUrl: './home.component.html',
               styleUrl: './home.component.scss'
           })
export default class HomeComponent {
}
