import {inject, Injectable, signal} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {TranslateService} from '@ngx-translate/core';
import {Observable, Subject, filter, finalize, of, timer} from 'rxjs';

import {ActionFormDialogComponent} from 'app/shared/action-form-dialog/action-form-dialog.component';
import {ConfirmDialogService} from 'app/shared/delete-dialog/confirm-dialog.service';
import {EmailDialogComponent} from 'app/shared/email-dialog/email-dialog.component';
import {EmailMessage} from 'app/shared/email-dialog/email-message';
import {AvailableAction, RefreshScope, refreshScopeOf} from 'app/shared/model/available-action';
import {ActionsService} from '../../common/actions.service';

/** Contexte d'actions des plans de facturation côté serveur. */
const BILLING_DOMAIN = 'billing';

/**
 * Actions dont l'effet réel se produit après la réponse HTTP : le serveur termine l'envoi
 * dans un thread séparé et prévient l'écran par WebSocket. La facture reste « en attente »
 * jusque-là.
 */
const ASYNC_ACTION_CODES = ['invoice-send', 'invoice-send-again', 'invoice-reminder', 'receipt-send'];

/** Garde-fou d'affichage : au-delà, on cesse d'annoncer une attente. */
const PENDING_EXPIRY_MS = 60_000;

/** État du chargement paresseux des actions d'un plan. */
type ActionsState = 'loading' | AvailableAction[];

/**
 * Actions dynamiques d'un plan de facturation : exécution (email, téléchargement,
 * action métier) et chargement paresseux des actions disponibles.
 *
 * Les actions ne sont jamais chargées pour toute la liste : elles le sont plan par
 * plan, à la première ouverture du rouage ou au premier dépliage de la ligne.
 */
@Injectable({providedIn: 'root'})
export class InvoicingPlanActionsService {
    /** Actions par identifiant de plan ; `loading` pendant la requête. */
    private readonly cache = signal<Record<string, ActionsState>>({});

    /** Plans dont un envoi asynchrone est en cours côté serveur. */
    private readonly pending = signal<Record<string, true>>({});

    private readonly actionsService = inject(ActionsService);
    private readonly modalService = inject(NgbModal);
    private readonly translateService = inject(TranslateService);
    private readonly confirmDialogService = inject(ConfirmDialogService);

    /** Vrai tant que l'écran attend la fin d'un envoi déclenché sur ce plan. */
    isPending(idInvoicingPlan: string): boolean {
        return this.pending()[idInvoicingPlan] === true;
    }

    /** Appelé quand le serveur a notifié la fin du traitement, ou après un rechargement. */
    clearPending(idInvoicingPlan: string): void {
        if (!this.isPending(idInvoicingPlan)) {
            return;
        }

        this.pending.update(pending => {
            const {[idInvoicingPlan]: _removed, ...rest} = pending;

            return rest;
        });
    }

    clearAllPending(): void {
        this.pending.set({});
    }

    /** Actions connues d'un plan, ou `undefined` si elles ne sont pas encore chargées. */
    actionsOf(idInvoicingPlan: string): AvailableAction[] | undefined {
        const state = this.cache()[idInvoicingPlan];

        return state === 'loading' || state === undefined ? undefined : state;
    }

    isLoading(idInvoicingPlan: string): boolean {
        return this.cache()[idInvoicingPlan] === 'loading';
    }

    /** Charge les actions du plan si ce n'est pas déjà fait ou en cours. */
    ensureLoaded(idInvoicingPlan: string): void {
        if (this.cache()[idInvoicingPlan] !== undefined) {
            return;
        }

        this.load(idInvoicingPlan);
    }

    /** Recharge les actions d'un plan après une mutation. */
    reload(idInvoicingPlan: string): void {
        if (this.cache()[idInvoicingPlan] === undefined) {
            return;
        }

        this.load(idInvoicingPlan);
    }

    /** Oublie les actions de tous les plans (après un rechargement complet de la liste). */
    clear(): void {
        this.cache.set({});
    }

    /**
     * Exécute une action et annonce ce qu'il faut relire ensuite : rien ne sort de
     * l'observable si l'utilisateur annule.
     */
    run(action: AvailableAction, idInvoicingPlan: string, target?: HTMLElement): Observable<RefreshScope> {
        switch (action.type) {
            case 'EMAIL':
                return this.runEmail(action, idInvoicingPlan);
            case 'DOWNLOAD':
                return this.runDownload(action, idInvoicingPlan);
            case 'BUSINESS':
                return this.runBusiness(action, idInvoicingPlan, target);
            default:
                console.warn(`Action type unknown : ${action.type}`);

                return of();
        }
    }

    private load(idInvoicingPlan: string): void {
        this.cache.update(cache => ({...cache, [idInvoicingPlan]: 'loading'}));

        this.actionsService.getAvailableActions(BILLING_DOMAIN, idInvoicingPlan)
            .subscribe({
                           next: actions => this.cache.update(cache => ({...cache, [idInvoicingPlan]: actions})),
                           error: () => this.cache.update(cache => ({...cache, [idInvoicingPlan]: []}))
                       });
    }

    private runEmail(action: AvailableAction, idInvoicingPlan: string): Observable<RefreshScope> {
        const done = new Subject<RefreshScope>();

        this.actionsService.templateEmailAction(action.contextCode, idInvoicingPlan).subscribe(template => {
            const modalRef = this.modalService.open(EmailDialogComponent, {size: 'xl'});
            modalRef.componentInstance.template = template;
            modalRef.componentInstance.context = action.contextCode;
            modalRef.componentInstance.entityId = idInvoicingPlan;

            modalRef.result.then((result: EmailMessage) => {
                if (!result) {
                    done.complete();

                    return;
                }

                this.actionsService.emailAction(action.contextCode, idInvoicingPlan, result)
                    .subscribe(() => this.finish(done, idInvoicingPlan, action));
            }).catch(() => done.complete());
        });

        return done.asObservable();
    }

    private runDownload(action: AvailableAction, idInvoicingPlan: string): Observable<RefreshScope> {
        const done = new Subject<RefreshScope>();

        this.actionsService.downloadAction(action.contextCode, idInvoicingPlan)
            .pipe(finalize(() => done.complete()))
            .subscribe(response => {
                const contentDisposition = response.headers.get('content-disposition') ?? '';
                const filename = getFilenameFromContentDisposition(contentDisposition) ?? 'document.pdf';
                const url = window.URL.createObjectURL(response.body!);

                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                link.click();

                window.URL.revokeObjectURL(url);

                // Un téléchargement n'a normalement rien changé, mais c'est le serveur qui le dit.
                done.next(refreshScopeOf(action));
            });

        return done.asObservable();
    }

    private runBusiness(action: AvailableAction, idInvoicingPlan: string, target?: HTMLElement): Observable<RefreshScope> {
        const done = new Subject<RefreshScope>();

        // Des champs sont requis : on passe par la modale de formulaire.
        if (action.requiredFields && action.requiredFields.length > 0) {
            const modalRef = this.modalService.open(ActionFormDialogComponent, {size: 'lg'});
            modalRef.componentInstance.requiredFields = action.requiredFields;
            modalRef.componentInstance.actionLabelKey = action.labelKey;

            modalRef.result.then((payload: Map<string, unknown>) => {
                if (payload) {
                    this.executeBusinessAction(action, idInvoicingPlan, done, payload);
                } else {
                    done.complete();
                }
            }).catch(() => done.complete());

            return done.asObservable();
        }

        const anchor = target ?? (document.activeElement as HTMLElement);
        const confirmMessageKey = action.confirmationKey ?? 'common.confirmAction.default';

        this.confirmDialogService.confirmAction(anchor, confirmMessageKey, {
            actionLabel: this.translateService.instant(action.labelKey)
        })
            .pipe(filter(confirmed => confirmed))
            .subscribe(() => this.executeBusinessAction(action, idInvoicingPlan, done));

        return done.asObservable();
    }

    private executeBusinessAction(action: AvailableAction,
                                  idInvoicingPlan: string,
                                  done: Subject<RefreshScope>,
                                  payload?: Map<string, unknown>): void {
        this.actionsService.businessAction(action.contextCode, idInvoicingPlan, payload as Map<string, any>)
            .subscribe(() => this.finish(done, idInvoicingPlan, action));
    }

    private finish(done: Subject<RefreshScope>, idInvoicingPlan: string, action: AvailableAction): void {
        this.markPendingIfAsync(idInvoicingPlan, action.contextCode);
        this.reload(idInvoicingPlan);
        done.next(refreshScopeOf(action));
        done.complete();
    }

    /**
     * L'envoi se poursuit côté serveur après la réponse : on signale l'attente jusqu'à la
     * notification de fin, avec une expiration de secours pour ne jamais rester bloqué.
     */
    private markPendingIfAsync(idInvoicingPlan: string, contextCode: string): void {
        if (!ASYNC_ACTION_CODES.includes(contextCode)) {
            return;
        }

        this.pending.update(pending => ({...pending, [idInvoicingPlan]: true}));
        timer(PENDING_EXPIRY_MS).subscribe(() => this.clearPending(idInvoicingPlan));
    }
}

/** Gère `filename*=UTF-8''…` et `filename="…"`. */
export function getFilenameFromContentDisposition(contentDisposition: string): string | null {
    const utf8 = contentDisposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
    if (utf8?.[1]) {
        return decodeURIComponent(utf8[1]);
    }

    const ascii = contentDisposition.match(/filename\s*=\s*"([^"]+)"/i)
        ?? contentDisposition.match(/filename\s*=\s*([^;]+)/i);

    return ascii?.[1]?.trim() ?? null;
}
