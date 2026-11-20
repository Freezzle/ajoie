import {ChangeDetectionStrategy, Component, computed, contentChildren, inject, input} from '@angular/core';
import {RouterLink} from '@angular/router';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';

import {EntityActionsMenuComponent} from '../entity-list/entity-actions-menu.component';
import {EntityAction} from '../entity-list/entity-list.model';
import {CardFooterContentDirective} from './card-footer.directive';

@Component({
               selector: 'app-card',
               standalone: true,
               imports: [RouterLink, TranslatePipe, EntityActionsMenuComponent],
               templateUrl: './card.component.html',
               styleUrl: './card.component.scss',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class CardComponent {
    readonly titleKey = input<string | null>(null);
    readonly title = input<string | null>(null);
    readonly lock = input<boolean>(false);
    readonly tag = input<string | null>(null);
    readonly actions = input<EntityAction[]>([]);
    readonly editing = input<boolean>(false);
    readonly dimmed = input<boolean>(false);
    readonly showHeader = input<boolean>(true);
    /** Affiche toujours le rouage, même avec une seule action. */
    readonly actionsAsMenu = input<boolean>(false);

    private readonly translateService = inject(TranslateService);
    private readonly footers = contentChildren(CardFooterContentDirective);

    readonly hasFooter = computed(() => this.footers().length > 0);

    readonly visibleActions = computed(() => this.actions().filter(action => !action.hidden));
    readonly resolvedTitle = computed(() => {
        if (this.title()) {
            return this.title();
        }

        return this.titleKey() ? this.translateService.instant(this.titleKey()!) as string : '';
    });

    runAction(action: EntityAction, event: MouseEvent): void {
        event.stopPropagation();
        action.run?.(event.currentTarget as HTMLElement);
    }
}
