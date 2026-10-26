import {ChangeDetectionStrategy, Component, inject, input, viewChild} from '@angular/core';
import {RouterLink} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {Menu, MenuModule} from 'primeng/menu';
import {Popover} from 'primeng/popover';

import {ConditionalKey} from '../../model/conditional-key';
import {AppMenuItem} from '../../utils/app-menu-item.model';

/**
 * Menu popup d'actions commun au bouton « Actions » d'un détail et au rouage d'une ligne.
 * L'appelant ne fournit que le déclencheur et appelle {@link toggle}.
 *
 * Une action porteuse d'un texte d'aide ou de conditions affiche une icône « ? »
 * (« ! » quand l'action est désactivée) qui ouvre un popover explicatif.
 *
 * Le menu étant projeté dans `body`, ses styles vivent dans `content/scss/_action-menu.scss`.
 */
@Component({
               selector: 'action-menu',
               imports: [MenuModule, Popover, RouterLink],
               templateUrl: './action-menu.component.html',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class ActionMenuComponent {
    readonly items = input<AppMenuItem[]>([]);
    readonly appendTo = input<any>('body');

    protected currentHelpText = '';
    protected currentConditionalKeys: ConditionalKey[] = [];

    private readonly translateService = inject(TranslateService);
    private readonly menu = viewChild<Menu>('menu');
    private readonly helpPopover = viewChild<Popover>('helpPopover');

    get helpLabel(): string {
        return this.translateService.instant('entityList.help') as string;
    }

    toggle(event: Event): void {
        this.menu()?.toggle(event);
    }

    hasHelp(item: AppMenuItem): boolean {
        return !!item.helpText || (item.conditionalKeys?.length ?? 0) > 0;
    }

    showHelp(event: Event, item: AppMenuItem): void {
        // Sans cela, le menu exécuterait l'action et se fermerait.
        event.stopPropagation();
        this.currentHelpText = item.helpText ?? '';
        this.currentConditionalKeys = item.conditionalKeys ?? [];
        this.helpPopover()?.toggle(event);
    }

    translateCondition(key: string): string {
        return this.translateService.instant(key) as string;
    }
}
