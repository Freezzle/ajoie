import {ChangeDetectionStrategy, Component, inject, input, viewChild} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {Popover} from 'primeng/popover';

import {ConditionalKey} from '../../model/conditional-key';

@Component({
               selector: 'action-help-popover',
               standalone: true,
               imports: [Popover],
               templateUrl: './action-help-popover.component.html',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class ActionHelpPopoverComponent {
    readonly helpText = input<string | null | undefined>(undefined);
    readonly conditionalKeys = input<ConditionalKey[]>([]);

    private readonly translateService = inject(TranslateService);
    private readonly helpPopover = viewChild<Popover>('helpPopover');

    toggle(event: Event): void {
        this.helpPopover()?.toggle(event);
    }

    translateCondition(key: string): string {
        return this.translateService.instant(key) as string;
    }
}
