import {ChangeDetectionStrategy, Component, computed, effect, inject, input, OnInit, output, signal} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import dayjs from 'dayjs/esm';
import {filter, switchMap, tap} from 'rxjs';

import SharedModule from 'app/shared/shared.module';
import {FormatMediumDatePipe} from 'app/shared/date';
import {ActionIconBoxComponent} from 'app/shared/components/action-icon-box/action-icon-box.component';
import {ButtonBoxComponent} from 'app/shared/components/button-box/button-box.component';
import {DialogBoxComponent} from 'app/shared/components/dialog-box/dialog-box.component';
import {EntityActionsMenuComponent} from 'app/shared/components/entity-list/entity-actions-menu.component';
import {EntityAction} from 'app/shared/components/entity-list/entity-list.model';
import {ConfirmDialogService} from 'app/shared/delete-dialog/confirm-dialog.service';
import {AvailableAction, RefreshScope} from 'app/shared/model/available-action';
import {InvoiceSendingMethod} from '../../enumerations/invoice-sending-method.model';
import {formatterInvoiceNature, InvoiceNature, isNegativeNature} from '../../enumerations/invoice-nature.model';
import {formatterPaymentMode} from '../../enumerations/mode.model';
import {State} from '../../enumerations/state.model';
import {Type} from '../../enumerations/type.model';
import {InvoiceFormComponent} from '../form/invoice-form.component';
import {PaymentFormComponent} from '../form/payment-form.component';
import {IInvoice, IInvoicingPlan, IInvoicingPlanList, IPayment} from '../model/invoicing-plan.interface';
import {InvoicingPlanActionsService} from '../service/invoicing-plan-actions.service';
import {InvoicingPlanHelperService} from '../service/invoicing-plan-helper.service';
import {InvoicingPlanService} from '../service/invoicing-plan.service';

/** Étape de la frise des dates. */
interface TimelineStep {
    key: string;
    label: string;
    date: dayjs.Dayjs | null;
    /** Texte affiché à la place de la date quand elle est inconnue. */
    fallback: string;
    status: 'ok' | 'now' | 'bad' | 'warn' | 'future';
    /** Style du trait qui précède le jalon. */
    segment: '' | 'seg-ok' | 'seg-run' | 'seg-bad' | 'seg-fut';
    /** Infobulle facultative, par exemple l'échéance qui a motivé un rappel. */
    hint?: string;
}

/** Codes d'action du serveur mis en avant dans la bande d'actions. */
const ACTION_SEND = 'invoice-send';
const ACTION_DOWNLOAD = 'invoice-download';
const ACTION_MARK_ISSUED = 'invoice-marked-as-issued';
const ACTION_MARK_PAID = 'invoice-marked-as-paid';
const ACTION_REMINDER = 'invoice-reminder';
const ACTION_PAY_ALL_CASH = 'invoice-pay-all-cash';
const ACTION_RECEIPT_SEND = 'receipt-send';
const ACTION_RECEIPT_DOWNLOAD = 'receipt-download';

/** Position relative du point « aujourd'hui » entre deux jalons. */
const TODAY_MIN_RATIO = 0.22;
const TODAY_MAX_RATIO = 0.78;
const TODAY_DEFAULT_RATIO = 0.35;

@Component({
               selector: 'app-invoicing-plan-detail',
               imports: [
                   SharedModule,
                   FormatMediumDatePipe,
                   ActionIconBoxComponent,
                   ButtonBoxComponent,
                   DialogBoxComponent,
                   EntityActionsMenuComponent,
                   InvoiceFormComponent,
                   PaymentFormComponent
               ],
               templateUrl: './invoicing-plan-detail.component.html',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class InvoicingPlanDetailComponent implements OnInit {
    readonly planId = input.required<string>();
    /** Ligne de liste correspondante, pour afficher le détail sans attendre la requête. */
    readonly summary = input.required<IInvoicingPlanList>();
    /** Actions du rouage, repris de la ligne de liste pendant que le détail est ouvert. */
    readonly actions = input<EntityAction[]>([]);
    /** Émis à l'ouverture du rouage, pour charger les actions à la demande. */
    readonly menuOpened = output<void>();
    /** Émis après toute modification : la liste se recharge. */
    readonly changed = output<void>();
    /** Émis quand seule cette facture a changé : la liste ne relit que sa ligne. */
    readonly refreshed = output<void>();

    readonly plan = signal<IInvoicingPlan | null>(null);
    readonly isLoading = signal<boolean>(false);

    readonly showInvoiceDialog = signal<boolean>(false);
    readonly showPaymentDialog = signal<boolean>(false);
    readonly editingInvoice = signal<IInvoice | null>(null);
    readonly editingPayment = signal<IPayment | null>(null);

    private readonly invoicingPlanService = inject(InvoicingPlanService);
    private readonly actionsService = inject(InvoicingPlanActionsService);
    private readonly confirmDialogService = inject(ConfirmDialogService);
    private readonly translateService = inject(TranslateService);
    private readonly helper = inject(InvoicingPlanHelperService);

    protected readonly State = State;

    constructor() {
        // La liste remplace l'objet `summary` quand la facture est rafraîchie (notamment à la
        // fin d'un envoi asynchrone) : les lignes et les paiements doivent suivre.
        let first = true;
        effect(() => {
            this.summary();

            if (first) {
                first = false;

                return;
            }

            this.fetch();
        });
    }

    ngOnInit(): void {
        this.actionsService.ensureLoaded(this.planId());
        this.fetch();
    }

    private fetch(): void {
        this.isLoading.set(true);
        this.invoicingPlanService.find(this.planId()).subscribe({
                                                                   next: plan => {
                                                                       this.plan.set(plan);
                                                                       this.isLoading.set(false);
                                                                   },
                                                                   error: () => this.isLoading.set(false)
                                                               });
    }

    // ── Bande d'actions ──────────────────────────────────────────────────────

    /** Prochaine étape, en gras à gauche de la bande d'actions. */
    readonly nextStepKey = computed(() => {
        const plan = this.summary();

        // Un envoi est en cours : c'est lui la prochaine étape, quel que soit l'état du plan.
        if (plan.state === State.IS_ISSUING || this.actionsService.isPending(this.planId())) {
            return 'issuing';
        }
        if (this.helper.isDraft(plan.state)) {
            return plan.invoiceSendingMethod === InvoiceSendingMethod.POSTAL ? 'post' : 'send';
        }
        if (plan.state === State.ISSUED) {
            if ((plan.balance ?? 0) <= 0) {
                return 'close';
            }

            return this.helper.bucket(plan) === 'late' ? 'remind' : 'wait';
        }

        return plan.state === State.PAID ? 'done' : 'none';
    });

    readonly nextStepClass = computed(() => {
        switch (this.nextStepKey()) {
            case 'remind':
                return 'is-late';
            case 'done':
                return 'is-done';
            default:
                return '';
        }
    });

    /** Actions mises en avant : au plus deux, et seulement si le serveur les autorise. */
    readonly mainActions = computed<AvailableAction[]>(() => {
        const plan = this.summary();
        const codes = this.mainActionCodes(plan);

        return codes.map(code => this.availableAction(code)).filter((action): action is AvailableAction => !!action);
    });

    readonly canSeePayments = computed(() => this.summary().state !== State.IS_ISSUING && !this.helper.isDraft(this.summary().state));

    /**
     * Vrai tant qu'on attend la fin d'un envoi : état « en cours d'envoi » posé par le
     * serveur, ou action asynchrone lancée depuis cet écran.
     */
    readonly isWaiting = computed(() => this.summary().state === State.IS_ISSUING
        || this.actionsService.isPending(this.planId()));

    /** « Ajouter un paiement » n'est pas une action serveur. */
    readonly canAddPayment = computed(() => this.summary().state === State.ISSUED && this.canMutate());

    readonly canAddInvoiceLine = computed(() => this.helper.isDraft(this.summary().state) && this.canMutate());

    readonly canEditInvoiceLines = computed(() => this.canAddInvoiceLine());

    readonly canEditPayments = computed(() => {
        const state = this.summary().state;

        return (this.helper.isDraft(state) || state === State.ISSUED) && this.canMutate();
    });

    // ── Cartes ───────────────────────────────────────────────────────────────

    readonly invoices = computed<IInvoice[]>(() => this.plan()?.invoices ?? []);

    readonly payments = computed<IPayment[]>(() => this.plan()?.payments ?? []);

    readonly invoicesTotal = computed(() => this.invoices()
                                                .reduce((sum, invoice) => sum + lineAmount(invoice), 0));

    readonly paymentsTotal = computed(() => this.payments()
                                                .reduce((sum, payment) => sum + (payment.amount ?? 0), 0));

    readonly balance = computed(() => this.invoicesTotal() - this.paymentsTotal());

    /** Cas de la ligne de solde : libellé, sous-texte, montant et fond. */
    readonly balanceCase = computed(() => {
        const plan = this.summary();
        const balance = this.balance();

        if (plan.state === State.CANCELLED) {
            return {styleClass: '', labelKey: 'invoicingPlan.detail.balance.cancelled', hint: '', amount: null};
        }

        if (this.helper.isDraft(plan.state) || plan.state === State.IS_ISSUING) {
            const hintKey = plan.invoiceSendingMethod === InvoiceSendingMethod.POSTAL
                            ? 'invoicingPlan.detail.balance.byPost'
                            : 'invoicingPlan.detail.balance.byEmail';

            return {
                styleClass: '',
                labelKey: 'invoicingPlan.detail.balance.toInvoice',
                hint: this.translateService.instant(hintKey) as string,
                amount: balance
            };
        }

        if (balance < 0) {
            return {
                styleClass: 'is-overpaid',
                labelKey: 'invoicingPlan.detail.balance.overpaid',
                hint: this.translateService.instant('invoicingPlan.detail.balance.refund') as string,
                amount: Math.abs(balance)
            };
        }

        if (balance === 0 || plan.state === State.PAID) {
            return {
                styleClass: 'is-settled',
                labelKey: 'invoicingPlan.detail.balance.settled',
                hint: plan.lastPaymentDate
                      ? this.translateService.instant('invoicingPlan.detail.balance.paidOn',
                                                      {date: longDate(plan.lastPaymentDate)}) as string
                      : '',
                amount: balance
            };
        }

        const late = this.helper.bucket(plan) === 'late';

        return {
            styleClass: late ? 'is-late' : '',
            labelKey: 'invoicingPlan.detail.balance.due',
            hint: late
                  ? this.translateService.instant('invoicingPlan.detail.balance.lateSince',
                                                  {days: -this.helper.urgency(plan)}) as string
                  : this.translateService.instant('invoicingPlan.detail.balance.dueOn',
                                                  {date: longDate(plan.expirationDate)}) as string,
            amount: balance
        };
    });

    // ── Frise ────────────────────────────────────────────────────────────────

    readonly timeline = computed<TimelineStep[]>(() => {
        const plan = this.summary();
        const late = this.helper.bucket(plan) === 'late';
        const steps: TimelineStep[] = [];

        steps.push({
                       key: 'generated',
                       label: this.label('generated'),
                       date: plan.generationDate ?? null,
                       fallback: '—',
                       status: 'ok',
                       segment: ''
                   });

        steps.push({
                       key: 'issued',
                       label: this.label('issued'),
                       date: plan.issuedDate ?? null,
                       fallback: '—',
                       status: plan.issuedDate
                               ? 'ok'
                               : (this.helper.isDraft(plan.state) || plan.state === State.IS_ISSUING
                                  ? 'now'
                                  : 'future'),
                       segment: ''
                   });

        (plan.reminders ?? []).forEach((reminder, index) => {
            const date = reminder.sentDate ?? null;
            // L'échéance du plan est repoussée après une relance : on affiche le retard
            // mesuré sur l'échéance qui était en vigueur au moment de l'envoi.
            const days = reminder.dueDateAtSend && date
                         ? dayjs(date).diff(dayjs(reminder.dueDateAtSend), 'day')
                         : 0;
            const isLate = days > 0;

            steps.push({
                           key: `reminder-${index}`,
                           label: isLate
                                  ? this.translateService.instant('invoicingPlan.detail.timeline.reminderLate',
                                                                  {days}) as string
                                  : this.label('reminder'),
                           date,
                           fallback: '—',
                           status: 'warn',
                           segment: '',
                           hint: isLate
                                 ? this.translateService.instant('invoicingPlan.detail.timeline.reminderHint',
                                                                 {
                                                                     days,
                                                                     date: longDate(reminder.dueDateAtSend)
                                                                 }) as string
                                 : undefined
                       });
        });

        if (plan.state !== State.CANCELLED) {
            steps.push({
                           key: 'due',
                           label: this.label('due'),
                           date: plan.expirationDate ?? null,
                           fallback: this.label('afterIssue'),
                           status: plan.state === State.PAID
                                   ? 'ok'
                                   : late ? 'bad' : plan.state === State.ISSUED ? 'now' : 'future',
                           segment: ''
                       });
        }

        if (plan.state === State.CANCELLED) {
            steps.push({
                           key: 'cancelled',
                           label: this.label('cancelled'),
                           date: null,
                           fallback: '—',
                           status: 'bad',
                           segment: ''
                       });
        } else {
            steps.push({
                           key: 'paid',
                           label: this.label('paid'),
                           date: plan.state === State.PAID ? plan.lastPaymentDate ?? null : null,
                           fallback: '—',
                           status: plan.state === State.PAID ? 'ok' : 'future',
                           segment: ''
                       });
        }

        // Les étapes datées sont triées entre elles ; celles sans date gardent leur rang.
        return withSegments(steps, late, plan.expirationDate ?? null);
    });

    /** Position du point doré ; `null` quand il ne doit pas s'afficher. */
    readonly todayMarker = computed<{ left: number; width: number; styleClass: string } | null>(() => {
        const plan = this.summary();
        const visible = plan.state === State.ISSUED
            || plan.state === State.IS_ISSUING
            || this.helper.isDraft(plan.state);

        if (!visible) {
            return null;
        }

        const steps = this.timeline();
        const count = steps.length;
        const today = dayjs();

        let previous = -1;
        steps.forEach((step, index) => {
            if (step.date && !dayjs(step.date).isAfter(today)) {
                previous = index;
            }
        });

        const next = previous + 1;
        if (previous < 0 || next >= count) {
            return null;
        }

        const center = (index: number): number => (index + 0.5) / count * 100;
        const nextDate = steps[next].date;

        let ratio = TODAY_DEFAULT_RATIO;
        if (nextDate && dayjs(nextDate).isAfter(today)) {
            const from = dayjs(steps[previous].date);
            const span = Math.max(1, dayjs(nextDate).diff(from, 'day'));
            ratio = Math.min(TODAY_MAX_RATIO, Math.max(TODAY_MIN_RATIO, today.diff(from, 'day') / span));
        }

        const left = center(previous) + ratio * (center(next) - center(previous));
        const styleClass = this.helper.bucket(plan) === 'late'
                           ? 'is-late'
                           : plan.state === State.ISSUED ? 'is-run' : '';

        return {left, width: Math.max(0, left - center(previous)), styleClass};
    });

    readonly todayTitle = computed(() => this.translateService.instant('invoicingPlan.detail.timeline.today',
                                                                      {date: dayjs().format('DD.MM')}) as string);

    // ── Interactions ─────────────────────────────────────────────────────────

    runAction(action: AvailableAction, target: HTMLElement): void {
        this.actionsService.run(action, this.planId(), target)
            .subscribe(scope => this.applyRefresh(scope));
    }

    addInvoiceLine(): void {
        this.editingInvoice.set(null);
        this.showInvoiceDialog.set(true);
    }

    editInvoiceLine(invoice: IInvoice): void {
        if (!this.canEditInvoiceLines()) {
            return;
        }

        this.editingInvoice.set(invoice);
        this.showInvoiceDialog.set(true);
    }

    onInvoiceDialogConfirm(draft: Partial<IInvoice> | null): void {
        if (!draft) {
            return;
        }

        const existing = this.editingInvoice();
        const invoice = {...existing, ...draft} as IInvoice;

        const request = invoice.id
                        ? this.invoicingPlanService.updateInvoice(this.planId(), invoice)
                        : this.invoicingPlanService.createInvoice(this.planId(), invoice);

        request.subscribe(() => this.reload());
        this.editingInvoice.set(null);
    }

    deleteInvoiceLine(target: HTMLElement, invoice: IInvoice): void {
        this.confirmDialogService.delete(target, 'invoicingPlan.detail.deleteLineQuestion',
                                         {label: invoice.label ?? ''})
            .pipe(
                filter(confirmed => confirmed),
                switchMap(() => this.invoicingPlanService.deleteInvoice(this.planId(), invoice.id)),
                tap(() => this.reload())
            ).subscribe();
    }

    addPayment(): void {
        this.editingPayment.set(null);
        this.showPaymentDialog.set(true);
    }

    editPayment(payment: IPayment): void {
        if (!this.canEditPayments()) {
            return;
        }

        this.editingPayment.set(payment);
        this.showPaymentDialog.set(true);
    }

    onPaymentDialogConfirm(draft: Partial<IPayment> | null): void {
        if (!draft) {
            return;
        }

        const existing = this.editingPayment();
        const payment = {...existing, ...draft} as IPayment;

        const request = payment.id
                        ? this.invoicingPlanService.updatePayment(this.planId(), payment)
                        : this.invoicingPlanService.createPayment(this.planId(), payment);

        request.subscribe(() => this.reload());
        this.editingPayment.set(null);
    }

    deletePayment(target: HTMLElement, payment: IPayment): void {
        this.confirmDialogService.delete(target, 'invoicingPlan.detail.deletePaymentQuestion', {})
            .pipe(
                filter(confirmed => confirmed),
                switchMap(() => this.invoicingPlanService.deletePayment(this.planId(), payment.id)),
                tap(() => this.reload())
            ).subscribe();
    }

    // ── Affichage ────────────────────────────────────────────────────────────

    lineAmount(invoice: IInvoice): number {
        return lineAmount(invoice);
    }

    hasCustomAmount(invoice: IInvoice): boolean {
        return Number(invoice.customAmount ?? 0) !== Number(invoice.defaultAmount ?? 0);
    }

    /** Distingue visuellement un rabais consenti d'une simple annulation de ligne. */
    natureBadge(invoice: IInvoice): { labelKey: string; styleClass: string } | null {
        if (!isNegativeNature(invoice.nature)) {
            return null;
        }

        return {
            labelKey:   formatterInvoiceNature(invoice.nature as InvoiceNature),
            styleClass: invoice.nature === InvoiceNature.REDUCTION ? 'is-reduction' : 'is-correction'
        };
    }

    customAmountTitle(invoice: IInvoice): string {
        return this.translateService.instant('invoicingPlan.amount.different',
                                             {defaultPrice: invoice.defaultAmount}) as string;
    }

    isDeletableLine(invoice: IInvoice): boolean {
        return this.canEditInvoiceLines() && (!invoice.type || invoice.type === Type.OTHERS);
    }

    paymentModeLabel(payment: IPayment): string {
        return payment.paymentMode
               ? this.translateService.instant(formatterPaymentMode(payment.paymentMode)) as string
               : '';
    }

    /** Libellé imprimé sur le document ; repli sur le mode pour les paiements historiques. */
    paymentLabel(payment: IPayment): string {
        const label = payment.label?.trim();

        return label && label.length > 0 ? label : this.paymentModeLabel(payment);
    }

    paymentsEmptyKey(): string {
        return this.helper.isDraft(this.summary().state)
               ? 'invoicingPlan.detail.payments.notYet'
               : 'invoicingPlan.detail.payments.empty';
    }

    stepDate(step: TimelineStep): string {
        return step.date ? dayjs(step.date).format('DD.MM') : step.fallback;
    }

    /**
     * Applique la portée annoncée par l'action. En portée `ENTITY`, c'est la liste qui relit
     * la ligne : l'effet sur `summary()` recharge ensuite ce détail, en une seule requête.
     */
    private applyRefresh(scope: RefreshScope): void {
        if (scope === 'NONE') {
            return;
        }

        this.actionsService.reload(this.planId());

        if (scope === 'LIST') {
            this.changed.emit();
        } else {
            this.refreshed.emit();
        }
    }

    /** Modification locale (ligne de facture, paiement) : seule cette facture est relue. */
    private reload(): void {
        this.actionsService.reload(this.planId());
        this.refreshed.emit();
    }

    private canMutate(): boolean {
        const state = this.summary().state;

        return state !== State.CANCELLED && state !== State.PAID;
    }

    private availableAction(code: string): AvailableAction | null {
        const actions = this.actionsService.actionsOf(this.planId());

        return actions?.find(action => action.contextCode === code && !action.disabled) ?? null;
    }

    private mainActionCodes(plan: IInvoicingPlanList): string[] {
        if (plan.state === State.IS_ISSUING || plan.state === State.CANCELLED) {
            return [];
        }

        if (this.helper.isDraft(plan.state)) {
            return plan.invoiceSendingMethod === InvoiceSendingMethod.POSTAL
                   ? [ACTION_MARK_ISSUED, ACTION_DOWNLOAD]
                   : [ACTION_SEND, ACTION_DOWNLOAD];
        }

        if (plan.state === State.PAID) {
            return [ACTION_RECEIPT_SEND, ACTION_RECEIPT_DOWNLOAD];
        }

        if ((plan.balance ?? 0) <= 0) {
            return [ACTION_MARK_PAID];
        }

        return this.helper.bucket(plan) === 'late' ? [ACTION_REMINDER] : [ACTION_PAY_ALL_CASH];
    }

    /** Le rappel est la seule action principale affichée en rouge. */
    actionType(action: AvailableAction): 'primary' | 'danger' | 'secondary' {
        if (action.contextCode === ACTION_REMINDER) {
            return 'danger';
        }

        return action.contextCode === ACTION_DOWNLOAD || action.contextCode === ACTION_RECEIPT_DOWNLOAD
               ? 'secondary'
               : 'primary';
    }

    private label(key: string): string {
        return this.translateService.instant(`invoicingPlan.detail.timeline.${key}`) as string;
    }
}

function lineAmount(invoice: IInvoice): number {
    return (invoice.quantity ?? 1) * (invoice.customAmount ?? 0);
}

function longDate(date: dayjs.Dayjs | null | undefined): string {
    return date ? dayjs(date).format('DD.MM.YYYY') : '';
}

/** Trait précédant chaque jalon : vert si passé, rouge après une échéance dépassée. */
function withSegments(steps: TimelineStep[], late: boolean, expirationDate: dayjs.Dayjs | null): TimelineStep[] {
    const today = dayjs();

    return steps.map((step, index) => {
        if (index === 0) {
            return step;
        }

        const previous = steps[index - 1];

        if (!step.date || dayjs(step.date).isAfter(today)) {
            return {...step, segment: 'seg-fut' as const};
        }

        if (late && previous.date && expirationDate && !dayjs(previous.date).isBefore(expirationDate)) {
            return {...step, segment: 'seg-bad' as const};
        }

        return {...step, segment: 'seg-ok' as const};
    });
}
