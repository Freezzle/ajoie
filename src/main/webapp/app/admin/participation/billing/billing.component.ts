import {Component, inject, input, OnInit, signal} from '@angular/core';
import {RouterModule} from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import {FormatMediumDatePipe} from 'app/shared/date';
import {IParticipation} from '../model/participation.interface';
import {IInvoice, IInvoicingPlan, IPayment} from '../model/invoicing-plan.interface';
import {ParticipationService} from '../service/participation.service';
import {EMPTY, Observable, of} from 'rxjs';
import {finalize, mergeMap, filter} from 'rxjs/operators';
import {HttpResponse} from '@angular/common/http';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {Type} from '../../enumerations/type.model';
import {State} from '../../enumerations/state.model';
import {InvoicingPlanService} from '../service/invoicing-plan.service';
import dayjs from 'dayjs/esm';

import {formatterStatus, Status} from '../../enumerations/status.model';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {AvailableAction} from '../../../shared/model/available-action';
import {EmailMessage} from '../../../shared/email-dialog/email-message';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {EmailDialogComponent} from '../../../shared/email-dialog/email-dialog.component';
import {ActionsService} from '../../common/actions.service';
import {EventModalComponent} from '../../../shared/event-modal/event-modal.component';
import {ActionFormDialogComponent} from '../../../shared/action-form-dialog/action-form-dialog.component';
import {InvoiceSendingMethod} from '../../enumerations/invoice-sending-method.model';
import {AccordionModule, AccordionTabCloseEvent, AccordionTabOpenEvent} from 'primeng/accordion';

import {AlertErrorComponent} from '../../../shared/alert/alert-error.component';
import {ConfirmPopup} from 'primeng/confirmpopup';
import {ConfirmDialogService} from '../../../shared/delete-dialog/confirm-dialog.service';

import {Badge} from 'primeng/badge';
import {ContentPageComponent} from '../../../shared/components/content-page/content-page.component';
import {CardComponent} from '../../../shared/components/card/card.component';
import {MenuBoxComponent} from '../../../shared/components/menu-box/menu-box.component';
import {TranslateService} from '@ngx-translate/core';
import {MenuItemBuilderService} from '../../../shared/utils/menu-item-builder.service';
import {AppMenuItem} from '../../../shared/utils/app-menu-item.model';
import {DialogBoxComponent} from '../../../shared/components/dialog-box/dialog-box.component';
import {InvoiceFormComponent} from './invoice-form.component';
import {PaymentFormComponent} from './payment-form.component';

@Component({
               selector: 'app-participation-stats',
               templateUrl: './billing.component.html',
               imports: [
                   SharedModule,
                   RouterModule,
                   FormatMediumDatePipe,
                   FormsModule,
                   ReactiveFormsModule,
                   ButtonBoxComponent,
                   AccordionModule,
                   
                   AlertErrorComponent,
                   ConfirmPopup,
                   
                   Badge,
                   ContentPageComponent,
                   CardComponent,
                   MenuBoxComponent,
                   DialogBoxComponent,
                   InvoiceFormComponent,
                   PaymentFormComponent,
               ]
           })
export class BillingComponent implements OnInit {
    participation = input<IParticipation | null>(null);

    invoicingPlans$: Observable<IInvoicingPlan[]> | undefined;
    isLoading = false;
    openPlanId: string | null = null;
    menuCachePlans = new Map<string, AppMenuItem[]>();
    billingInfoForm!: FormGroup<BillingInfoGroup>;

    // ── Dialogs ──────────────────────────────────────────────────────────────
    showInvoiceDialog = signal(false);
    showPaymentDialog = signal(false);
    editingInvoice: IInvoice | null = null;
    editingPayment: IPayment | null = null;
    /** Référence au plan courant lors de l'ouverture d'un dialog */
    private activePlan: IInvoicingPlan | null = null;

    protected readonly Type = Type;
    protected readonly State = State;
    protected participationService = inject(ParticipationService);
    protected invoicingPlanService = inject(InvoicingPlanService);
    protected actionsService = inject(ActionsService);
    protected modalService = inject(NgbModal);
    protected translateService = inject(TranslateService);
    protected menuItemBuilderService = inject(MenuItemBuilderService);
    protected confirmDialogService = inject(ConfirmDialogService);
    protected readonly Status = Status;
    protected readonly dayjs = dayjs;
    protected readonly formatterStatus = formatterStatus;
    protected readonly Object = Object;
    protected readonly InvoiceSendingMethod = InvoiceSendingMethod;

    ngOnInit(): void {
        this.billingInfoForm = new FormGroup<BillingInfoGroup>({
                                                                   participation: new FormControl({
                                                                                                      value: this.participation(),
                                                                                                      disabled: true
                                                                                                  }),
                                                                   exhibitorEmail: new FormControl({
                                                                                                       value: this.participation()!.exhibitor?.email ?? null,
                                                                                                       disabled: true
                                                                                                   }),
                                                                   invoiceSendingMethod: new FormControl({
                                                                                                             value: this.participation()!.invoiceSendingMethod ?? null,
                                                                                                             disabled: true
                                                                                                         }),
                                                                   needArrangement: new FormControl({
                                                                                                        value: this.participation()!.needArrangement ?? null,
                                                                                                        disabled: true
                                                                                                    }),
                                                                   status: new FormControl({
                                                                                               value: this.participation()!.status ?? null,
                                                                                               disabled: true
                                                                                           }),
                                                                   extraInformation: new FormControl({
                                                                                                         value: this.participation()!.extraInformation ?? null,
                                                                                                         disabled: true
                                                                                                     })
                                                               });
        this.loadInvoicePlans();
    }

    previousState(): void {
        window.history.back();
    }

    onOpeningCollapseChange(event: AccordionTabOpenEvent) {
        this.openPlanId = String(event.index);
    }

    onClosingCollapseChange(_event: AccordionTabCloseEvent) {
        this.openPlanId = null;
    }

    loadInvoicePlans(): void {
        this.invoicingPlans$ = this.participationService.getInvoicingPlans(this.participation()!.id).pipe(
            mergeMap((response: HttpResponse<IInvoicingPlan[]>) => {
                const invoicingPlansList = response.body ?? [];

                invoicingPlansList.forEach(plan => {
                    // Actions disponibles
                    this.actionsService.getAvailableActions('billing', plan.id).subscribe(actions => {
                        plan.availableActions = actions;
                        this.menuCachePlans.set(plan.id, this.buildInvoicingPlanMenuItems(plan));
                    });

                    // Init des flags UI
                    plan.invoices?.forEach(inv => (inv.readMode = true));
                    plan.payments?.forEach(pay => (pay.readMode = true));
                });

                return invoicingPlansList.length ? of(invoicingPlansList) : EMPTY;
            })
        );
    }

    hasDiffCustomAndDefault(invoice: IInvoice): boolean {
        return Number(invoice.customAmount ?? 0) !== Number(invoice.defaultAmount ?? 0);
    }

    totalInvoices(invoicingPlan: IInvoicingPlan): number {
        return (invoicingPlan.invoices ?? [])
            .map(invoice => (invoice.quantity ?? 1) * (invoice.customAmount ?? 0))
            .reduce((previousValue, defaultAmount) => previousValue + defaultAmount, 0);
    }

    totalPayments(invoicingPlan: IInvoicingPlan): number {
        return (invoicingPlan.payments ?? []).map(payment => Number(payment.amount ?? 0))
                                             .reduce((previousValue, defaultAmount) => previousValue + defaultAmount, 0);
    }

    remainingTotal(invoicingPlan: IInvoicingPlan): number {
        return this.totalInvoices(invoicingPlan) - this.totalPayments(invoicingPlan);
    }

    editInvoice(invoicingPlan: IInvoicingPlan, invoice: IInvoice): void {
        this.activePlan = invoicingPlan;
        this.editingInvoice = invoice;
        this.showInvoiceDialog.set(true);
    }

    onInvoiceDialogConfirm(draft: Partial<IInvoice> | null): void {
        if (!draft || !this.activePlan) return;
        const invoice = this.editingInvoice ?? {} as IInvoice;
        Object.assign(invoice, draft);
        this.saveInvoice(this.activePlan.id, invoice).subscribe(res => {
            this.applyInvoiceResponse(invoice, res);
            if (!this.editingInvoice) {
                // Mode création : recharger pour que l'id soit bien renseigné
                this.loadInvoicePlans();
            }
        });
        this.editingInvoice = null;
        this.activePlan = null;
    }

    onInvoiceDialogCancel(): void {
        // Si c'était une création (pas encore d'id), on retire l'élément fantôme
        if (this.editingInvoice && !this.editingInvoice.id && this.activePlan) {
            const idx = this.activePlan.invoices?.indexOf(this.editingInvoice) ?? -1;
            if (idx >= 0) this.activePlan.invoices?.splice(idx, 1);
        }
        this.editingInvoice = null;
        this.activePlan = null;
    }

    editPayment(invoicingPlan: IInvoicingPlan, payment: IPayment): void {
        this.activePlan = invoicingPlan;
        this.editingPayment = payment;
        this.showPaymentDialog.set(true);
    }

    onPaymentDialogConfirm(draft: Partial<IPayment> | null): void {
        if (!draft || !this.activePlan) return;
        const payment = this.editingPayment ?? {} as IPayment;
        Object.assign(payment, draft);
        this.savePayment(this.activePlan.id, payment).subscribe(res => {
            this.applyPaymentResponse(payment, res);
            this.loadInvoicePlans();
        });
        this.editingPayment = null;
        this.activePlan = null;
    }

    onPaymentDialogCancel(): void {
        // Si c'était une création (pas encore d'id), on retire l'élément fantôme
        if (this.editingPayment && !this.editingPayment.id && this.activePlan) {
            const idx = this.activePlan.payments?.indexOf(this.editingPayment) ?? -1;
            if (idx >= 0) this.activePlan.payments?.splice(idx, 1);
        }
        this.editingPayment = null;
        this.activePlan = null;
    }

    addInvoice(invoicingPlan: IInvoicingPlan): void {
        this.activePlan = invoicingPlan;
        this.editingInvoice = null;
        this.showInvoiceDialog.set(true);
    }

    addPayment(invoicingPlan: IInvoicingPlan): void {
        this.activePlan = invoicingPlan;
        this.editingPayment = null;
        this.showPaymentDialog.set(true);
    }

    deleteInvoice(invoicingPlan: IInvoicingPlan, invoiceToRemove: IInvoice): void {
        const indexToRemove = invoicingPlan.invoices?.findIndex(invoice => invoice === invoiceToRemove);

        if (invoiceToRemove.id) {
            this.invoicingPlanService.deleteInvoice(invoicingPlan.id, invoiceToRemove.id).subscribe(() => {
                if (indexToRemove !== undefined && indexToRemove >= 0) {
                    invoicingPlan.invoices?.splice(indexToRemove, 1);
                    this.loadInvoicePlans();
                }
            });
        } else {
            if (indexToRemove !== undefined && indexToRemove >= 0) {
                invoicingPlan.invoices?.splice(indexToRemove, 1);
                this.loadInvoicePlans();
            }
        }
    }

    deletePayment(invoicingPlan: IInvoicingPlan, paymentToRemove: IPayment): void {
        const indexToRemove = invoicingPlan.payments?.findIndex(payment => payment === paymentToRemove);

        if (paymentToRemove.id) {
            this.invoicingPlanService.deletePayment(invoicingPlan.id, paymentToRemove.id).subscribe(() => {
                if (indexToRemove !== undefined && indexToRemove >= 0) {
                    invoicingPlan.payments?.splice(indexToRemove, 1);
                    this.loadInvoicePlans();
                }
            });
        } else {
            if (indexToRemove !== undefined && indexToRemove >= 0) {
                invoicingPlan.payments?.splice(indexToRemove, 1);
                this.loadInvoicePlans();
            }
        }
    }

    disableActionButton(_invoicingPlan: IInvoicingPlan): boolean {
        return this.isLoading;
    }

    showInvoicingAction(_plan: IInvoicingPlan): boolean {
        return true;
    }

    openEmailPopup(action: AvailableAction, id: string) {
        this.actionsService.templateEmailAction(action.contextCode, id).subscribe(template => {
            const modalRef = this.modalService.open(EmailDialogComponent, {size: 'xl'});
            modalRef.componentInstance.template = template;
            modalRef.componentInstance.context = action.contextCode;
            modalRef.componentInstance.entityId = id;

            modalRef.result.then((result: EmailMessage) => {
                if (result) {
                    this.isLoading = true;
                    this.actionsService.emailAction(action.contextCode, id, result)
                        .pipe(finalize(() => this.isLoading = false)).subscribe(() => {
                        this.loadInvoicePlans();
                    });
                }
            }).catch(() => {
            });
        });
    }

    clickAction(action: AvailableAction, invoicingPlan: IInvoicingPlan, htmlElement?: HTMLElement) {
        if (action.type === 'EMAIL') {
            this.openEmailPopup(action, invoicingPlan.id);
        } else if (action.type === 'DOWNLOAD') {
            this.isLoading = true;
            this.actionsService.downloadAction(action.contextCode, invoicingPlan.id)
                .pipe(finalize(() => this.isLoading = false)).subscribe(res => {
                const cd = res.headers.get('content-disposition') ?? '';
                const filename = this.getFilenameFromContentDisposition(cd) ?? 'document.pdf';

                const blob = res.body!;
                const url = window.URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();

                window.URL.revokeObjectURL(url);
            });
        } else if (action.type === 'BUSINESS') {
            this.handleBusinessAction(action, invoicingPlan.id, htmlElement);
        } else {
            console.warn('Action type unknown : ' + action.type);
        }
    }

    private handleBusinessAction(action: AvailableAction, invoicingPlanId: string, htmlElement?: HTMLElement): void {
        // Si des champs sont requis, ouvrir la modale de formulaire
        if (action.requiredFields && action.requiredFields.length > 0) {
            const modalRef = this.modalService.open(ActionFormDialogComponent, {size: 'lg'});
            modalRef.componentInstance.requiredFields = action.requiredFields;
            modalRef.componentInstance.actionLabelKey = action.labelKey;

            modalRef.result.then((payload: Map<string, any>) => {
                if (payload) {
                    this.executeBusinessAction(action.contextCode, invoicingPlanId, payload);
                }
            });
        } else {
            const targetElement = htmlElement || document.activeElement as HTMLElement;

            const confirmMessageKey = action.confirmationKey || 'common.confirmAction.default';

            this.confirmDialogService.confirmAction(targetElement, confirmMessageKey, {
                actionLabel: this.translateService.instant(action.labelKey)
            })
                .pipe(filter(confirmed => confirmed))
                .subscribe(() => {
                    this.executeBusinessAction(action.contextCode, invoicingPlanId);
                });
        }
    }

    private executeBusinessAction(context: string, invoicingPlanId: string, payload?: Map<string, any>): void {
        this.isLoading = true;
        this.actionsService.businessAction(context, invoicingPlanId, payload)
            .pipe(finalize(() => this.isLoading = false))
            .subscribe(() => {
                this.loadInvoicePlans();
            });
    }

    generate(): void {
        this.participationService.generateInvoices(this.participation()!.id).subscribe(() => {
            this.loadInvoicePlans();
        });
    }


    showCreateInvoice(plan: IInvoicingPlan): boolean {
        return this.isDraftState(plan) && this.canMutatePlan(plan);
    }

    showCreatePayment(plan: IInvoicingPlan): boolean {
        return this.isIssuedState(plan) && this.canMutatePlan(plan);
    }

    showInvoiceActions(plan: IInvoicingPlan): boolean {
        return this.isDraftState(plan) && this.canMutatePlan(plan);
    }

    showPaymentActions(plan: IInvoicingPlan): boolean {
        return (this.isDraftState(plan) || this.isIssuedState(plan)) && this.canMutatePlan(plan);
    }


    isDraftState(invoicingPlan: IInvoicingPlan): boolean {
        return invoicingPlan.state === State.DRAFT || invoicingPlan.state === State.ISOLATED;
    }

    isIssuedState(invoicingPlan: IInvoicingPlan): boolean {
        return invoicingPlan.state === State.ISSUED;
    }

    isDateExpired(invoicingPlan: IInvoicingPlan): boolean {
        return (invoicingPlan.expirationDate && dayjs().isAfter(invoicingPlan.expirationDate)) ?? false;
    }

    isInvoicingPlanBlocked(invoicingPlan: IInvoicingPlan): boolean {
        return invoicingPlan.state === State.CANCELLED || invoicingPlan.state === State.PAID
               || this.participation()?.status === Status.CLOSED;
    }

    openHistoryModalForInvoicingPlan(invoicingPlan: IInvoicingPlan): void {
        this.invoicingPlanService.getEventLogs(invoicingPlan.id).subscribe(events => {
            const modalRef = this.modalService.open(EventModalComponent, {size: 'lg'});
            modalRef.componentInstance.events = events.body ?? [];
        });
    }

    buildInvoicingPlanMenuItems(invoicingPlan: any): AppMenuItem[] {
        const items: AppMenuItem[] = [];


        // Utilisation du service centralisé pour construire les items à partir des actions disponibles
        const actionItems = this.menuItemBuilderService.buildMenuItemsFromActions(
            invoicingPlan.availableActions ?? [],
            (action, htmlElement) => this.clickAction(action, invoicingPlan, htmlElement),
            (_action) => this.disableActionButton(invoicingPlan)
        );

        items.push(...actionItems);

        return items;
    }

    getInvoicingPlanStateBadgeClass(plan: IInvoicingPlan): string {
        switch (plan.state) {
            case State.PAID:
                return 'bg-primary';
            case State.CANCELLED:
                return 'bg-danger';
            case State.ISSUED:
                return 'bg-info';
            case State.DRAFT:
            case State.ISOLATED:
            case State.IS_ISSUING:
                return 'bg-success';
            default:
                return 'bg-warning';
        }
    }

    private saveInvoice(invoicingPlanId: string, invoice: IInvoice) {
        return invoice.id
               ? this.invoicingPlanService.updateInvoice(invoicingPlanId, invoice)
               : this.invoicingPlanService.createInvoice(invoicingPlanId, invoice);
    }

    private applyInvoiceResponse(invoice: IInvoice, response: HttpResponse<IInvoice>): void {
        const body = response.body;
        if (!body) {
            return;
        }

        invoice.id = body.id;
        invoice.defaultAmount = body.defaultAmount;
        invoice.customAmount = body.customAmount;
        invoice.extraInformation = body.extraInformation;
        invoice.generationDate = body.generationDate;
        invoice.lock = body.lock;
    }

    private applyPaymentResponse(payment: IPayment, response: HttpResponse<IPayment>): void {
        const body = response.body;
        if (!body) {
            return;
        }

        payment.id = body.id;
        payment.paymentMode = body.paymentMode;
        payment.extraInformation = body.extraInformation;
        payment.billingDate = body.billingDate;
        payment.amount = body.amount;
    }

    private savePayment(invoicingPlanId: string, payment: IPayment) {
        return payment.id
               ? this.invoicingPlanService.updatePayment(invoicingPlanId, payment)
               : this.invoicingPlanService.createPayment(invoicingPlanId, payment);
    }

    private getFilenameFromContentDisposition(cd: string): string | null {
        // gère filename*=UTF-8''... et filename="..."
        const utf8 = cd.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
        if (utf8?.[1]) {
            return decodeURIComponent(utf8[1]);
        }

        const ascii = cd.match(/filename\s*=\s*"([^"]+)"/i) ?? cd.match(/filename\s*=\s*([^;]+)/i);
        return ascii?.[1]?.trim() ?? null;
    }


    private canMutatePlan(plan: IInvoicingPlan): boolean {
        return !this.isInvoicingPlanBlocked(plan);
    }
}

export type BillingInfoGroup = {
    participation: FormControl<IParticipation | null>;
    exhibitorEmail: FormControl<string | null>;
    invoiceSendingMethod: FormControl<InvoiceSendingMethod | null>;
    needArrangement: FormControl<boolean | null>;
    status: FormControl<Status | null>;
    extraInformation: FormControl<string | null>;
};
