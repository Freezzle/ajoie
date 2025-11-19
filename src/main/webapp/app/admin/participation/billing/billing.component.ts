import {Component, inject, input, OnInit} from '@angular/core';
import {RouterModule} from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import {FormatMediumDatePipe} from 'app/shared/date';
import {getFormattedParticipationName, IParticipation} from '../model/participation.interface';
import {IInvoice, IInvoicingPlan, IPayment} from '../model/invoicing-plan.interface';
import {formatterParticipation, ParticipationService} from '../service/participation.service';
import {EMPTY, Observable, of} from 'rxjs';
import {finalize, mergeMap} from 'rxjs/operators';
import {HttpResponse} from '@angular/common/http';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import ColorLockBooleanPipe from '../../../shared/pipe/color-lock-boolean.pipe';
import LockBooleanPipe from '../../../shared/pipe/lock-boolean.pipe';
import {Type} from '../../enumerations/type.model';
import {State} from '../../enumerations/state.model';
import {InvoicingPlanService} from '../service/invoicing-plan.service';
import dayjs from 'dayjs/esm';
import {Mode} from '../../enumerations/mode.model';
import {formatterStatus, Status} from '../../enumerations/status.model';
import {CheckboxBoxComponent} from '../../../shared/components/checkbox-box/checkbox-box.component';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {AvailableAction} from '../../../shared/model/available-action';
import {EmailMessage} from '../../../shared/email-dialog/email-message';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {EmailDialogComponent} from '../../../shared/email-dialog/email-dialog.component';
import {ActionsService} from '../../common/actions.service';
import {EventModalComponent} from '../../../shared/event-modal/event-modal.component';
import {formatterInvoiceMethod, InvoiceSendingMethod} from "../../enumerations/invoice-sending-method.model";
import {TextBoxComponent} from "../../../shared/components/text-box/text-box.component";
import {SelectBoxComponent} from "../../../shared/components/select-box/select-box.component";
import {TextareaBoxComponent} from "../../../shared/components/textarea-box/textarea-box.component";
import {LinkBoxComponent} from "../../../shared/components/link-box/link-box.component";

@Component({
    selector: 'jhi-participation-stats',
    templateUrl: './billing.component.html',
    imports: [
        SharedModule,
        RouterModule,
        FormatMediumDatePipe,
        FormsModule,
        ColorLockBooleanPipe,
        LockBooleanPipe,
        ReactiveFormsModule,
        CheckboxBoxComponent,
        ButtonBoxComponent,
        TextBoxComponent,
        SelectBoxComponent,
        TextareaBoxComponent,
        LinkBoxComponent,

    ]
})
export class BillingComponent implements OnInit {
    participation = input<IParticipation | null>(null);

    invoicingPlans$: Observable<IInvoicingPlan[]> | undefined;
    isLoading = false;
    modeValues = Object.keys(Mode);
    selectedInvoices: string[] = [];
    invoicePlanOnSplitMode: string | null = null;

    billingInfoForm!: FormGroup<BillingInfoGroup>;

    protected readonly Type = Type;
    protected readonly State = State;
    protected participationService = inject(ParticipationService);
    protected invoicingPlanService = inject(InvoicingPlanService);
    protected actionsService = inject(ActionsService);
    protected modalService = inject(NgbModal);

    ngOnInit(): void {
        this.billingInfoForm = new FormGroup<BillingInfoGroup>({
            participation: new FormControl({value: this.participation(), disabled: true}),
            exhibitorEmail: new FormControl({value: this.participation()!.exhibitor?.email ?? null, disabled: true}),
            invoiceSendingMethod: new FormControl({
                value: this.participation()!.invoiceSendingMethod ?? null,
                disabled: true
            }),
            needArrangement: new FormControl({value: this.participation()!.needArrangement ?? null, disabled: true}),
            status: new FormControl({value: this.participation()!.status ?? null, disabled: true}),
            extraInformation: new FormControl({value: this.participation()!.extraInformation ?? null, disabled: true})
        });
        this.loadInvoicePlans();
    }

    previousState(): void {
        window.history.back();
    }

    loadInvoicePlans(): void {
        this.invoicingPlans$ = this.participationService.getInvoicingPlans(this.participation()!.id).pipe(
            mergeMap((invoicingPlans: HttpResponse<IInvoicingPlan[]>) => {
                if (invoicingPlans.body) {
                    const invoicingPlansList = invoicingPlans.body;

                    invoicingPlansList.forEach(ipl => {
                        this.actionsService.getAvailableActions('billing', ipl.id).subscribe((result) => {
                            ipl.availableActions = result;
                        });
                    });

                    invoicingPlansList.forEach(ipl => {
                        ipl.invoices?.forEach(invoice => {
                            invoice.readMode = true;
                        });
                    });

                    invoicingPlansList.forEach(ipl => {
                        ipl.payments?.forEach(payment => {
                            payment.readMode = true;
                        });
                    });

                    return of(invoicingPlansList);
                } else {
                    return EMPTY;
                }
            }),
        );
    }

    hasDiffCustomAndDefault(invoice: IInvoice): boolean {
        return Number(invoice.customAmount ?? 0) !== Number(invoice.defaultAmount ?? 0);
    }

    onSelectInvoice(invoice: IInvoice) {
        if (invoice.selected) {
            invoice.selected = false;
            this.selectedInvoices = this.selectedInvoices.filter(inv => inv !== invoice.id);
        } else {
            invoice.selected = true;
            this.selectedInvoices.push(invoice.id);
        }
    }

    onClickLock(invoice: IInvoice): void {
        invoice.lock = !invoice.lock;
    }

    onCustomAmountChange(event: any, invoice: IInvoice): void {
        invoice.customAmount = Number(event.target.value);
    }

    onLabelChange(event: any, invoice: IInvoice): void {
        invoice.label = event.target.value;
    }

    onExtraInformationChange(event: any, invoice: IInvoice): void {
        invoice.extraInformation = event.target.value;
    }

    onPaymentModeChange(event: any, payment: IPayment): void {
        payment.paymentMode = event.target.value;
    }

    onAmountPaymentChange(event: any, payment: IPayment): void {
        payment.amount = Number(event.target.value);
    }

    onExtraInformationPaymentChange(event: any, payment: IPayment): void {
        payment.extraInformation = event.target.value;
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

    updateInvoice(invoicingPlan: IInvoicingPlan, invoice: IInvoice): void {
        invoice.readMode = true;

        if (invoice.id) {
            this.invoicingPlanService.updateInvoice(invoicingPlan.id, invoice)
                .subscribe(invoiceResponse => this.fetchInvoiceResult(invoice, invoiceResponse));
        } else {
            this.invoicingPlanService.createInvoice(invoicingPlan.id, invoice)
                .subscribe(invoiceResponse => this.fetchInvoiceResult(invoice, invoiceResponse));
        }
    }

    private fetchInvoiceResult(invoice: IInvoice, invoiceResponse: HttpResponse<IInvoice>) {
        if (invoiceResponse.body) {
            invoice.id = invoiceResponse.body.id;
            invoice.defaultAmount = invoiceResponse.body.defaultAmount;
            invoice.customAmount = invoiceResponse.body.customAmount;
            invoice.extraInformation = invoiceResponse.body.extraInformation;
            invoice.generationDate = invoiceResponse.body.generationDate;
            invoice.lock = invoiceResponse.body.lock;
        }
    }

    editInvoice(invoice: IInvoice): void {
        invoice.readMode = false;
    }

    updatePayment(invoicingPlan: IInvoicingPlan, payment: IPayment): void {
        payment.readMode = true;

        if (payment.id) {
            this.invoicingPlanService.updatePayment(invoicingPlan.id, payment)
                .subscribe(paymentResponse => this.fetchPaymentResult(payment, paymentResponse));
        } else {
            this.invoicingPlanService.createPayment(invoicingPlan.id, payment)
                .subscribe(paymentResponse => this.fetchPaymentResult(payment, paymentResponse));
        }
    }

    private fetchPaymentResult(payment: IPayment, paymentResponse: HttpResponse<IPayment>) {
        if (paymentResponse.body) {
            payment.id = paymentResponse.body.id;
            payment.paymentMode = paymentResponse.body.paymentMode;
            payment.extraInformation = paymentResponse.body.extraInformation;
            payment.billingDate = paymentResponse.body.billingDate;
            payment.amount = paymentResponse.body.amount;
        }
    }

    editPayment(payment: IPayment): void {
        payment.readMode = false;
    }

    addInvoice(invoicingPlan: IInvoicingPlan): void {
        invoicingPlan.invoices?.push({
            customAmount: null,
            defaultAmount: null,
            extraInformation: null,
            generationDate: dayjs(),
            label: null,
            lock: true,
            quantity: 1,
            readMode: false,
            type: Type.OTHERS,
            selected: false,
        } as IInvoice);
    }

    addPayment(invoicingPlan: IInvoicingPlan): void {
        invoicingPlan.payments?.push({
            amount: null,
            paymentMode: Mode.BANK,
            billingDate: dayjs(),
            extraInformation: null,
            readMode: false,
        } as IPayment);
    }

    deletePayment(invoicingPlan: IInvoicingPlan, paymentToRemove: IPayment): void {
        const indexToRemove = invoicingPlan.payments?.findIndex(payment => payment === paymentToRemove);

        if (paymentToRemove.id) {
            this.invoicingPlanService.deletePayment(invoicingPlan.id, paymentToRemove.id).subscribe(() => {
                if (indexToRemove !== undefined && indexToRemove >= 0) {
                    invoicingPlan.payments?.splice(indexToRemove, 1);
                }
            });
        } else {
            if (indexToRemove !== undefined && indexToRemove >= 0) {
                invoicingPlan.payments?.splice(indexToRemove, 1);
            }
        }
    }

    isPaymentEditable(payment: IPayment): boolean {
        return !payment.readMode;
    }

    mustPaymentBeDisabled(payment: IPayment, invoicingPlan: IInvoicingPlan): boolean {
        return !this.isPaymentEditable(payment) || this.isDraftState(invoicingPlan) || this.participation()?.status === Status.CLOSED;
    }

    isInvoiceEditable(invoice: IInvoice): boolean {
        return !invoice.readMode;
    }

    mustInvoiceBeDisabled(invoice: IInvoice, invoicingPlan: IInvoicingPlan): boolean {
        return !this.isInvoiceEditable(invoice) || !this.isDraftState(invoicingPlan) || this.participation()?.status === Status.CLOSED;
    }

    disableActionButton(invoicingPlan: IInvoicingPlan): boolean {
        return (
            this.isLoading ||
            this.isPlanOnSplitMode(invoicingPlan) ||
            !invoicingPlan.invoices?.every((inv: IInvoice) => inv.readMode) ||
            !invoicingPlan.payments?.every((pay: IPayment) => pay.readMode)
        );
    }

    mustDisableSendButton(invoicingPlan: IInvoicingPlan): boolean {
        return (
            this.isLoading ||
            !invoicingPlan.invoices?.every((inv: IInvoice) => inv.readMode) ||
            !invoicingPlan.payments?.every((pay: IPayment) => pay.readMode) ||
            this.isInvoicingPlanBlocked(invoicingPlan)
        );
    }

    showSplit(invoicingPlan: IInvoicingPlan): boolean {
        return this.isDraftState(invoicingPlan);
    }

    showInvoicingAction(invoicingPlan: IInvoicingPlan): boolean {
        return !this.isPlanOnSplitMode(invoicingPlan);
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

    clickAction(action: AvailableAction, invoicingPlan: IInvoicingPlan) {
        if (action.type === 'EMAIL') {
            this.openEmailPopup(action, invoicingPlan.id);
        } else if (action.type === 'DOWNLOAD') {
            this.isLoading = true;
            this.actionsService.downloadAction(action.contextCode, invoicingPlan.id)
                .pipe(finalize(() => this.isLoading = false)).subscribe(blob => {
                const url = window.URL.createObjectURL(new Blob([blob], {type: 'application/pdf'}));
                window.open(url);

                setTimeout(() => {
                    window.URL.revokeObjectURL(url);
                }, 5000);
            });
        } else if (action.type === 'BUSINESS') {
            this.isLoading = true;
            this.actionsService.businessAction(action.contextCode, invoicingPlan.id)
                .pipe(finalize(() => this.isLoading = false)).subscribe(() => {
                this.loadInvoicePlans();
            });
        } else {
            console.warn('Action type unknown : ' + action.type);
        }
    }

    generate(): void {
        this.participationService.generateInvoices(this.participation()!.id).subscribe(() => {
            this.loadInvoicePlans();
        });
    }

    startSplit(invoicingPlan: IInvoicingPlan): void {
        this.selectedInvoices = [];
        this.invoicePlanOnSplitMode = invoicingPlan.id;
    }

    cancelSplit(invoicingPlan: IInvoicingPlan): void {
        if (invoicingPlan) {
            this.selectedInvoices = [];
            this.invoicePlanOnSplitMode = null;
        }
    }

    isPlanOnSplitMode(invoicingPlan: IInvoicingPlan): boolean {
        return invoicingPlan.id === this.invoicePlanOnSplitMode;
    }

    validateSplit(invoicingPlan: IInvoicingPlan): void {
        if (invoicingPlan) {
            this.invoicingPlanService.splitInvoicingPlan(invoicingPlan?.id, this.selectedInvoices)
                .subscribe(() => {
                    this.selectedInvoices = [];
                    this.invoicePlanOnSplitMode = null;
                    this.loadInvoicePlans();
                });
        }
    }

    activateArrangement(invoicingPlan: IInvoicingPlan): void {
        this.invoicingPlanService.switchArrangement(invoicingPlan.id).subscribe(() => {
            invoicingPlan.needArrangement = true;
        });
    }

    deactivateArrangement(invoicingPlan: IInvoicingPlan): void {
        this.invoicingPlanService.switchArrangement(invoicingPlan.id).subscribe(() => {
            invoicingPlan.needArrangement = false;
        });
    }

    switchSendingToEmail(invoicingPlan: IInvoicingPlan): void {
        this.invoicingPlanService.switchInvoiceSendingMethod(invoicingPlan.id, InvoiceSendingMethod.EMAIL).subscribe(() => {
            invoicingPlan.invoiceSendingMethod = InvoiceSendingMethod.EMAIL;
            this.loadInvoicePlans();
        });
    }

    switchSendingToPostal(invoicingPlan: IInvoicingPlan): void {
        this.invoicingPlanService.switchInvoiceSendingMethod(invoicingPlan.id, InvoiceSendingMethod.POSTAL).subscribe(() => {
            invoicingPlan.invoiceSendingMethod = InvoiceSendingMethod.POSTAL;
            this.loadInvoicePlans();
        });
    }

    showCreateInvoice(invoicingPlan: IInvoicingPlan): boolean {
        return this.isDraftState(invoicingPlan) && !this.isInvoicingPlanBlocked(invoicingPlan) &&
            !this.isPlanOnSplitMode(invoicingPlan);
    }

    showCreatePayment(invoicingPlan: IInvoicingPlan): boolean {
        return this.isIssuedState(invoicingPlan) && !this.isInvoicingPlanBlocked(invoicingPlan) && !this.isPlanOnSplitMode(invoicingPlan);
    }

    showInvoiceActions(invoicingPlan: IInvoicingPlan): boolean {
        return this.isDraftState(invoicingPlan) && !this.isInvoicingPlanBlocked(invoicingPlan) &&
            !this.isPlanOnSplitMode(invoicingPlan);
    }

    showPaymentActions(invoicingPlan: IInvoicingPlan): boolean {
        return (this.isDraftState(invoicingPlan) || this.isIssuedState(invoicingPlan)) &&
            !this.isInvoicingPlanBlocked(invoicingPlan) &&
            !this.isPlanOnSplitMode(invoicingPlan);
    }

    showDeactivateArrangement(invoicingPlan: IInvoicingPlan): boolean {
        return this.isDraftState(invoicingPlan) && invoicingPlan.needArrangement;
    }

    showActivateArrangement(invoicingPlan: IInvoicingPlan): boolean {
        return this.isDraftState(invoicingPlan) && !invoicingPlan.needArrangement;
    }

    showSwitchToEmail(invoicingPlan: IInvoicingPlan): boolean {
        return this.isDraftState(invoicingPlan) && invoicingPlan.invoiceSendingMethod === InvoiceSendingMethod.POSTAL;
    }

    showSwitchToPostal(invoicingPlan: IInvoicingPlan): boolean {
        return this.isDraftState(invoicingPlan) && invoicingPlan.invoiceSendingMethod === InvoiceSendingMethod.EMAIL;
    }

    isDraftState(invoicingPlan: IInvoicingPlan): boolean {
        return invoicingPlan.state === State.DRAFT || invoicingPlan.state === State.ISOLATED;
    }

    isIssuingState(invoicingPlan: IInvoicingPlan): boolean {
        return invoicingPlan.state === State.IS_ISSUING;
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

    isInvoicingPlanCancelled(invoicingPlan: IInvoicingPlan): boolean {
        return invoicingPlan.state === State.CANCELLED;
    }

    isInvoicingPlanPaid(invoicingPlan: IInvoicingPlan): boolean {
        return invoicingPlan.state === State.PAID
    }

    openHistoryModal(): void {
        this.participationService.getEventLogs(this.participation()!.id).subscribe(events => {
            const modalRef = this.modalService.open(EventModalComponent, {size: 'lg'});
            modalRef.componentInstance.events = events.body ?? [];
        });
    }

    protected readonly Status = Status;
    protected readonly dayjs = dayjs;
    protected readonly getFormattedParticipationName = getFormattedParticipationName;
    protected readonly formatterInvoiceMethod = formatterInvoiceMethod;
    protected readonly formatterParticipation = formatterParticipation;
    protected readonly formatterStatus = formatterStatus;
    protected readonly Object = Object;
    protected readonly InvoiceSendingMethod = InvoiceSendingMethod;
}

export type BillingInfoGroup = {
    participation: FormControl<IParticipation | null>;
    exhibitorEmail: FormControl<string | null>;
    invoiceSendingMethod: FormControl<keyof typeof InvoiceSendingMethod | null>;
    needArrangement: FormControl<boolean | null>;
    status: FormControl<keyof typeof Status | null>;
    extraInformation: FormControl<string | null>;
};