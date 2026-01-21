import {Component, inject} from '@angular/core';
import {Router, RouterModule} from '@angular/router';
import {AccountService} from 'app/core/auth/account.service';
import {LoginService} from 'app/login/login.service';
import {NavigationStateService} from '../navbar/navigation-state.service';
import SharedModule from 'app/shared/shared.module';
import {PresenceComponent} from '../../admin/presence/component/presence.component';
import {ChatMessagesComponent} from '../../admin/chat/component/chat-messages.component';
import HasAnyAuthorityDirective from 'app/shared/auth/has-any-authority.directive';
import {ButtonBoxComponent} from 'app/shared/components/button-box/button-box.component';

@Component({
               selector: 'app-topbar',
               templateUrl: './topbar.component.html',
               styleUrl: './topbar.component.scss',
               imports: [SharedModule, PresenceComponent, ChatMessagesComponent, HasAnyAuthorityDirective, RouterModule, ButtonBoxComponent]
           })
export default class TopbarComponent {
    account = inject(AccountService).trackCurrentAccount();
    navigationService = inject(NavigationStateService);

    private loginService = inject(LoginService);
    private router = inject(Router);

    toggleSidebar(): void {
        this.navigationService.toggleSidebar();
    }

    login(): void {
        this.router.navigate(['/login']);
    }

    logout(): void {
        this.loginService.logout();
        this.router.navigate(['']);
    }
}
