import {ChangeDetectionStrategy, Component, Input, ViewChild} from '@angular/core';
import {Menu, MenuModule} from 'primeng/menu';
import {CommonModule} from '@angular/common';
import {ButtonModule} from 'primeng/button';
import {TranslateModule} from '@ngx-translate/core';
import {ButtonBoxComponent} from '../button-box/button-box.component';
import {SEVERITY} from '../../utils/severity';
import {AppMenuItem} from '../../utils/app-menu-item.model';
import {Tooltip} from 'primeng/tooltip';
import {Popover} from 'primeng/popover';
import {isMobile as checkIsMobile} from '../../utils/device.util';

@Component({
               selector: 'menu-box',
               imports: [CommonModule, MenuModule, ButtonModule, TranslateModule, ButtonBoxComponent, Tooltip, Popover],
               templateUrl: './menu-box.component.html',
               styleUrl: './menu-box.component.scss',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class MenuBoxComponent {
    @Input({required: true}) items: AppMenuItem[] = [];
    @Input() type: SEVERITY = 'primary';
    @Input() buttonTranslateKey: string | null = null;
    @Input() buttonIcon?: string;
    @Input() buttonDisabled = false;
    @Input() appendTo: any = 'body';

    @ViewChild('menu') menu!: Menu;
    @ViewChild('helpPopover') helpPopover!: Popover;

    currentHelpText = '';

    isMobile(): boolean {
        return checkIsMobile();
    }

    onItemClick(event: Event, item: AppMenuItem): void {
        if (item.command && !item.disabled) {
            item.command({originalEvent: event, item: item});
            // Fermer le menu après l'action
            this.menu.hide();
        }
    }

    showHelp(event: Event, helpText: string): void {
        event.stopPropagation();
        if (checkIsMobile()) {
            this.currentHelpText = helpText;
            this.helpPopover.toggle(event);
        }
        // Sur desktop, le tooltip s'affiche automatiquement via pTooltip
    }
}
