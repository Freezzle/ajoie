import {Component, input} from '@angular/core';
import {RouterModule} from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import {IAuthority} from '../authority.model';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {AlertErrorComponent} from '../../../shared/alert/alert-error.component';
import {AlertComponent} from '../../../shared/alert/alert.component';

@Component({
               standalone: true,
               selector: 'app-authority-stats',
               templateUrl: './authority-detail.component.html',
               imports: [SharedModule, RouterModule, ButtonBoxComponent, AlertErrorComponent, AlertComponent]
           })
export class AuthorityDetailComponent {
    authority = input<IAuthority | null>(null);

    previousState(): void {
        window.history.back();
    }
}
