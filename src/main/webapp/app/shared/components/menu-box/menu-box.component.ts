import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {ButtonModule} from 'primeng/button';
import {ActionMenuComponent} from '../action-menu/action-menu.component';
import {ButtonBoxComponent} from '../button-box/button-box.component';
import {SEVERITY} from '../../utils/severity';
import {AppMenuItem} from '../../utils/app-menu-item.model';

/** Bouton « Actions » ouvrant le menu partagé {@link ActionMenuComponent}. */
@Component({
               selector: 'menu-box',
               imports: [ButtonModule, ButtonBoxComponent, ActionMenuComponent],
               templateUrl: './menu-box.component.html',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class MenuBoxComponent {
    @Input({required: true}) items: AppMenuItem[] = [];
    @Input() type: SEVERITY = 'primary';
    @Input() buttonTranslateKey: string | null = null;
    @Input() buttonIcon?: string;
    @Input() buttonDisabled = false;
    @Input() appendTo: any = 'body';
}
