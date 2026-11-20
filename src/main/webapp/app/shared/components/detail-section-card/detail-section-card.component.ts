import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';

import {CardComponent} from '../card/card.component';
import {CardFooterContentDirective} from '../card/card-footer.directive';
import {ButtonBoxComponent} from '../button-box/button-box.component';
import {EntityAction} from '../entity-list/entity-list.model';

@Component({
               selector: 'app-detail-section-card',
               standalone: true,
               imports: [CardComponent, CardFooterContentDirective, ButtonBoxComponent],
               templateUrl: './detail-section-card.component.html',
               styleUrl: './detail-section-card.component.scss',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class DetailSectionCardComponent {
    readonly titleKey = input<string | null>(null);
    readonly title = input<string | null>(null);
    readonly lock = input(false);
    readonly tag = input<string | null>(null);
    readonly editing = input(false);
    readonly dimmed = input(false);
    readonly actions = input<EntityAction[]>([]);
    readonly showFooterActions = input(false);
    readonly saveDisabled = input(false);
    readonly cancelLabelKey = input('common.cancel');
    readonly saveLabelKey = input('common.save');

    readonly cancelRequested = output<void>();
    readonly saveRequested = output<void>();
}
