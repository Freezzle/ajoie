import {ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, output, viewChild} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {MenuItem} from 'primeng/api';
import {Menu} from 'primeng/menu';

import SharedModule from '../../shared.module';
import {EntityAction} from './entity-list.model';

/**
 * Rouage ouvrant le menu d'actions d'une entité. L'hôte est en `display: contents` :
 * le bouton se place directement dans la barre qui l'accueille (pied de ligne ou
 * bande d'actions du détail).
 */
@Component({
               selector: 'entity-actions-menu',
               imports: [SharedModule, Menu],
               templateUrl: './entity-actions-menu.component.html',
               styleUrl: './entity-actions-menu.component.scss',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class EntityActionsMenuComponent {
    readonly actions = input<EntityAction[]>([]);
    /** Émis à l'ouverture du menu, pour charger les actions à la demande. */
    readonly opened = output<void>();

    private readonly translateService = inject(TranslateService);
    private readonly gear = viewChild<ElementRef<HTMLButtonElement>>('gear');

    readonly actionsLabel = computed(() => this.translateService.instant('entityList.actions') as string);

    readonly menuItems = computed<MenuItem[]>(() => {
        const items: MenuItem[] = [];

        this.actions().filter(action => !action.hidden).forEach(action => {
            if (action.separatorBefore && items.length > 0) {
                items.push({separator: true});
            }

            items.push({
                           label: this.translateService.instant(action.labelKey) as string,
                           icon: action.icon,
                           routerLink: action.routerLink,
                           disabled: action.disabled,
                           styleClass: action.danger ? 'el-menu-danger' : undefined,
                           command: action.run ? () => action.run!(this.gear()!.nativeElement) : undefined
                       });
        });

        return items;
    });

    openMenu(menu: Menu, event: Event): void {
        event.stopPropagation();
        this.opened.emit();
        menu.toggle(event);
    }
}
