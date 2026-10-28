import {Status} from '../../enumerations/status.model';

/** Un paiement situé dans le temps (date de facturation + montant). */
export interface IDatedAmount {
    date: string;
    amount: number;
}

/** Médiane et répartition par tranches d'un délai (en jours). */
export interface IDelayStats {
    medianDays: number | null;
    buckets: number[];
}

/** Restant à encaisser réparti par ancienneté (en CHF). */
export interface IAging {
    notDue: number;
    overdueUnder30: number;
    overdueOver30: number;
}

/**
 * Données agrégées du tableau de bord d'un salon, renvoyées par
 * {@code GET /api/admin/salons/{idSalon}/dashboard}. Voir docs/feature.md §9.
 */
export interface ISalonDashboard {
    /** Paiements des plans non annulés du salon (chronologie des montants). */
    payments: IDatedAmount[];
    /** Nombre par statut, par type : clés STAND, CONFERENCE, WORKSHOP. */
    statusCounts: Record<string, Record<Status, number>>;
    /** Exposants déjà venus (fidèles). */
    loyalReturning: number;
    /** Nouveaux exposants. */
    loyalNew: number;
    /** Recettes par prestation : STAND, SHARED, CONFERENCE, WORKSHOP, MEALS, ELECTRICITY, POSTAL_FEE, OTHERS. */
    revenueByService: Record<string, number>;
    /** Délai de paiement : tranches < 10 j · 10–30 j · > 30 j. */
    paymentDelay: IDelayStats;
    /** Délai de vérification : tranches < 1 sem. · 1–2 sem. · 2–4 sem. · > 4 sem. */
    verificationDelay: IDelayStats;
    /** Avancement de la facturation : clés DRAFT, ISSUED, PARTIAL, PAID. */
    billingProgress: Record<string, number>;
    /** Restant à encaisser par ancienneté. */
    receivables: IAging;
    /** Identifiants des stands confirmés. */
    confirmedStandIds: string[];
    /** Identifiants des conférences et ateliers confirmés. */
    confirmedTalkIds: string[];
}
