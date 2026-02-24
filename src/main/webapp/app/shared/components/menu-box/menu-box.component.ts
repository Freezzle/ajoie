import {ChangeDetectionStrategy, Component, Input, ViewChild} from '@angular/core';
import {Menu, MenuModule} from 'primeng/menu';
import {CommonModule} from '@angular/common';
import {ButtonModule} from 'primeng/button';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {ButtonBoxComponent} from '../button-box/button-box.component';
import {SEVERITY} from '../../utils/severity';
import {AppMenuItem} from '../../utils/app-menu-item.model';
import {Popover} from 'primeng/popover';
import {ConditionalKey} from '../../model/conditional-key';

@Component({
               selector: 'menu-box',
               imports: [CommonModule, MenuModule, ButtonModule, TranslateModule, ButtonBoxComponent, Popover],
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
    currentConditionalKeys: ConditionalKey[] = [];

    constructor(private translateService: TranslateService) {}

    onItemClick(event: Event, item: AppMenuItem): void {
        if (item.command && !item.disabled) {
            item.command({originalEvent: event, item: item});
            this.menu.hide();
        }
    }

    showHelp(event: Event, helpText: string, conditionalKeys: ConditionalKey[] = []): void {
        event.stopPropagation();
        this.currentHelpText = helpText;
        this.currentConditionalKeys = conditionalKeys;
        this.helpPopover.toggle(event);
    }

    getTranslatedCondition(key: string): string {
        return this.translateService.instant(key) as string;
    }
}
