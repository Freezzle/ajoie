import {Component, input} from '@angular/core';
import {RouterModule} from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import {IAuthority} from '../authority.model';

@Component({
    standalone: true,
    selector: 'jhi-authority-stats',
    templateUrl: './authority-detail.component.html',
    imports: [SharedModule, RouterModule],
})
export class AuthorityDetailComponent {
    authority = input<IAuthority | null>(null);

    previousState(): void {
        window.history.back();
    }
}
