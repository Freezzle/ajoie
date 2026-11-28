import {ChangeDetectionStrategy, Component, computed, inject, input, output, viewChild} from '@angular/core';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';

import {ConditionalKey} from '../../model/conditional-key';
import {SEVERITY} from '../../utils/severity';
import {ActionHelpPopoverComponent} from '../action-help-popover/action-help-popover.component';

@Component({
               selector: 'button-with-help-box',
               standalone: true,
               imports: [TranslatePipe, ActionHelpPopoverComponent],
               templateUrl: './button-with-help-box.component.html',
               styleUrl: './button-with-help-box.component.scss',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class ButtonWithHelpBoxComponent {
    readonly translateKey = input.required<string>();
    readonly primeIcon = input<string | undefined>(undefined);
    readonly type = input<SEVERITY>('primary');
    readonly isDisabled = input<boolean>(false);
    readonly loading = input<boolean>(false);
    readonly helpText = input<string | undefined>(undefined);
    readonly conditionalKeys = input<ConditionalKey[]>([]);
    readonly fullWidth = input<boolean>(false);

    readonly clickedEvent = output<HTMLElement>();

    private readonly translateService = inject(TranslateService);
    private readonly helpPopover = viewChild<ActionHelpPopoverComponent>('helpPopover');

    readonly hasHelp = computed(() => !!this.helpText() || this.conditionalKeys().length > 0);
    readonly helpLabel = computed(() => this.translateService.instant('entityList.help') as string);
    readonly helpAriaLabel = computed(
        () => `${this.helpLabel()}: ${this.translateService.instant(this.translateKey()) as string}`
    );

    onAction(event: MouseEvent): void {
        this.clickedEvent.emit(event.currentTarget as HTMLElement);
    }

    toggleHelp(event: Event): void {
        event.stopPropagation();
        this.helpPopover()?.toggle(event);
    }
}
