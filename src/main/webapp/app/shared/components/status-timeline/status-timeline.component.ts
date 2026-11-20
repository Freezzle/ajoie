import {ChangeDetectionStrategy, Component, computed, inject, input, output, signal, viewChild} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {ConfirmPopup} from 'primeng/confirmpopup';
import {Popover} from 'primeng/popover';

import {ConfirmDialogService} from '../../delete-dialog/confirm-dialog.service';
import {AvailableAction} from '../../model/available-action';
import {ConditionalKey} from '../../model/conditional-key';
import {SEVERITY} from '../../utils/severity';
import {ButtonBoxComponent} from '../button-box/button-box.component';
import {EntityActionsMenuComponent} from '../entity-list/entity-actions-menu.component';
import {EntityAction} from '../entity-list/entity-list.model';

export interface StatusTimelineActionRequest {
    action: AvailableAction;
    target: HTMLElement;
}

export interface StatusTimelineStep {
    key: string;
    label: string;
    sublabel?: string;
    state: 'done' | 'current' | 'todo' | 'error';
}

const STATUS_CYCLE = ['IN_VERIFICATION', 'ACCEPTED', 'VALIDATED', 'CLOSED'] as const;
const OFF_CYCLE = ['REFUSED', 'CANCELED'];

@Component({
               selector: 'app-status-timeline',
               standalone: true,
               imports: [ConfirmPopup, Popover, ButtonBoxComponent, EntityActionsMenuComponent],
               templateUrl: './status-timeline.component.html',
               styleUrl: './status-timeline.component.scss',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class StatusTimelineComponent {
    readonly status = input<string | null>(null);
    readonly availableActions = input<AvailableAction[]>([]);
    readonly actions = input<EntityAction[]>([]);
    readonly hint = input<string | null>(null);
    readonly labelKeyPrefix = input<string>('statusTimeline.status');

    readonly actionRequested = output<StatusTimelineActionRequest>();
    readonly opened = output<void>();

    private readonly translateService = inject(TranslateService);
    private readonly confirmDialogService = inject(ConfirmDialogService);

    protected currentHelpText = '';
    protected currentConditionalKeys: ConditionalKey[] = [];
    private readonly helpPopover = viewChild<Popover>('helpPopover');

    readonly isOffCycle = computed(() => OFF_CYCLE.includes(this.status()?.toUpperCase() ?? ''));

    readonly steps = computed<StatusTimelineStep[]>(() => {
        const status = this.status()?.toUpperCase() ?? '';
        const off = OFF_CYCLE.includes(status);
        const currentIndex = STATUS_CYCLE.indexOf(status as typeof STATUS_CYCLE[number]);

        const cycleSteps: StatusTimelineStep[] = STATUS_CYCLE.map((cycleStatus, index) => {
            let state: 'done' | 'current' | 'todo' = 'todo';

            if (off) {
                state = index === 0 ? 'done' : 'todo';
            } else if (status === 'CLOSED') {
                state = 'done';
            } else if (currentIndex >= 0) {
                if (index < currentIndex) {
                    state = 'done';
                } else if (index === currentIndex) {
                    state = 'current';
                }
            }

            return {
                key: cycleStatus,
                label: this.statusLabel(cycleStatus),
                state
            };
        });

        if (off) {
            cycleSteps.push({
                                key: status,
                                label: this.statusLabel(status),
                                sublabel: this.translateService.instant('statusTimeline.offCycle') as string,
                                state: 'error'
                            });
        }

        return cycleSteps;
    });

    readonly primaryAvailableActions = computed(() => {
        const status = this.status()?.toUpperCase() ?? '';
        const actions = this.availableActions();

        if (status === 'IN_VERIFICATION') {
            return this.pickDistinct([
                                          this.findAction(actions, ['accept', 'accepte', 'acceptation']),
                                          this.findAction(actions, ['refus', 'refuse', 'reject'])
                                      ]);
        }
        if (status === 'ACCEPTED') {
            return this.pickDistinct([this.findAction(actions, ['valid', 'validate', 'validation'])]);
        }
        if (status === 'VALIDATED') {
            return this.pickDistinct([this.findAction(actions, ['close', 'clôt', 'clot'])]);
        }
        if (status === 'REFUSED' || status === 'CANCELED') {
            return this.pickDistinct([this.findAction(actions, ['reopen', 'rouvr', 'rétabl', 'reopen'])]);
        }

        return [];
    });

    readonly gearAvailableActions = computed(() => {
        const primary = new Set(this.primaryAvailableActions().map(action => action.contextCode));

        return this.availableActions().filter(action => !primary.has(action.contextCode));
    });

    readonly gearActions = computed<EntityAction[]>(() => {
        const available = this.gearAvailableActions().map(action => ({
                                                                            labelKey: action.labelKey,
                                                                            icon: iconForActionType(action.type),
                                                                            danger: this.isDangerAction(action),
                                                                            disabled: action.disabled,
                                                                            helpText: action.helpKey
                                                                                ? this.translateService.instant(action.helpKey) as string
                                                                                : undefined,
                                                                            conditionalKeys: action.conditionalKeys ?? [],
                                                                            run: (target: HTMLElement) => this.runAvailableAction(action, target)
                                                                        }));

        return [...available, ...this.actions().filter(action => !action.hidden)];
    });

    statusLabel(status: string): string {
        const key = `${this.labelKeyPrefix()}.${status}`;
        const translated = this.translateService.instant(key) as string;

        return translated === key ? status : translated;
    }

    runAvailableAction(action: AvailableAction, target: HTMLElement): void {
        const confirmationKey = action.confirmationKey
            ?? (this.isDangerAction(action) ? 'common.confirmAction.default' : null);

        if (confirmationKey) {
            this.confirmDialogService
                .confirmAction(target, confirmationKey, {actionLabel: this.translateService.instant(action.labelKey)})
                .subscribe(confirmed => {
                    if (confirmed) {
                        this.actionRequested.emit({action, target});
                    }
                });
        } else {
            this.actionRequested.emit({action, target});
        }
    }

    get helpLabel(): string {
        return this.translateService.instant('entityList.help') as string;
    }

    hasHelp(action: AvailableAction): boolean {
        return !!action.helpKey || (action.conditionalKeys?.length ?? 0) > 0;
    }

    showHelp(event: Event, action: AvailableAction): void {
        this.currentHelpText = action.helpKey ? this.translateService.instant(action.helpKey) as string : '';
        this.currentConditionalKeys = action.conditionalKeys ?? [];
        this.helpPopover()?.toggle(event);
    }

    translateCondition(key: string): string {
        return this.translateService.instant(key) as string;
    }

    runPrimaryAction(action: AvailableAction, target: HTMLElement): void {
        this.runAvailableAction(action, target);
    }

    actionSeverity(action: AvailableAction): SEVERITY {
        return this.isDangerAction(action) ? 'danger' : 'primary';
    }

    private findAction(actions: AvailableAction[], patterns: string[]): AvailableAction | null {
        const normalized = actions.map(action => ({
                                                       action,
                                                       text: `${action.contextCode} ${action.labelKey}`.toLowerCase()
                                                   }));

        return normalized.find(({text}) => patterns.some(pattern => text.includes(pattern)))?.action ?? null;
    }

    private pickDistinct(actions: Array<AvailableAction | null>): AvailableAction[] {
        const seen = new Set<string>();

        return actions
            .filter((action): action is AvailableAction => !!action)
            .filter(action => {
                if (seen.has(action.contextCode)) {
                    return false;
                }

                seen.add(action.contextCode);

                return true;
            });
    }

    private isDangerAction(action: AvailableAction): boolean {
        const text = `${action.contextCode} ${action.labelKey}`.toLowerCase();

        return text.includes('refus')
            || text.includes('reject')
            || text.includes('cancel')
            || text.includes('annul');
    }
}

/** Icône du menu d'actions, alignée sur les listes factures/participations. */
function iconForActionType(type: string): string {
    switch (type) {
        case 'EMAIL':
            return 'pi pi-envelope';
        case 'DOWNLOAD':
            return 'pi pi-file-pdf';
        default:
            return 'pi pi-bolt';
    }
}
