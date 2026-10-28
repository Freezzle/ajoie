/**
 * Catalogue des métriques du tableau de bord d'un salon (docs/feature.md §5 à §7).
 *
 * Ce fichier ne contient que des définitions (données pures, sans dépendance Angular) :
 * identifiant, thème, type de visualisation et sources de données nécessaires. Le calcul
 * des valeurs est dans {@code salon-dashboard.utils.ts} et l'affichage dans le composant.
 */

/** Les quatre thèmes, dans leur ordre d'affichage. */
export type DashboardTheme = 'participations' | 'billing' | 'stands' | 'logistics';

/** Sources de données chargées en parallèle (voir §8). */
export type DashboardSource =
    | 'participations'
    | 'stats'
    | 'dashboard'
    | 'tasks'
    | 'volunteers'
    | 'talks'
    | 'floorPlans';

/** Type de visualisation d'une carte de métrique. */
export type MetricVisual = 'stack' | 'bars' | 'status' | 'none';

export interface MetricDef {
    /** Identifiant stable, utilisé dans le choix mémorisé et les clés i18n. */
    id: string;
    theme: DashboardTheme;
    visual: MetricVisual;
    /** Sources à charger pour calculer cette métrique. */
    sources: DashboardSource[];
    /** Lien « Voir → » éventuel (destination relative). */
    link?: 'stands' | 'floorPlan';
}

/** Ordre et métadonnées des thèmes (icône FontAwesome). */
export const THEME_ORDER: DashboardTheme[] = ['participations', 'billing', 'stands', 'logistics'];

export const THEME_ICON: Record<DashboardTheme, string> = {
    participations: 'users',
    billing: 'file-invoice',
    stands: 'store',
    logistics: 'calendar-days'
};

/** Choix par défaut si rien n'est mémorisé (§5.4). */
export const DEFAULT_METRICS: string[] = ['status', 'categories', 'dimensions', 'billingProgress'];

/**
 * Les 17 métriques, dans l'ordre du catalogue (§7). L'ordre détermine aussi l'ordre
 * d'affichage à l'intérieur d'une zone de « Mes indicateurs ».
 */
export const METRIC_DEFS: MetricDef[] = [
    // Thème Participations
    {id: 'status', theme: 'participations', visual: 'status', sources: ['participations', 'dashboard']},
    {id: 'loyalty', theme: 'participations', visual: 'stack', sources: ['dashboard']},
    {id: 'channel', theme: 'participations', visual: 'stack', sources: ['participations']},
    {id: 'verificationDelay', theme: 'participations', visual: 'bars', sources: ['dashboard']},
    // Thème Facturation
    {id: 'revenueByService', theme: 'billing', visual: 'bars', sources: ['dashboard']},
    {id: 'discounts', theme: 'billing', visual: 'none', sources: ['stats']},
    {id: 'paymentDelay', theme: 'billing', visual: 'bars', sources: ['dashboard']},
    {id: 'mealPayment', theme: 'billing', visual: 'stack', sources: ['participations']},
    {id: 'billingProgress', theme: 'billing', visual: 'bars', sources: ['dashboard']},
    {id: 'receivablesAging', theme: 'billing', visual: 'bars', sources: ['dashboard']},
    // Thème Stands
    {id: 'categories', theme: 'stands', visual: 'bars', sources: ['stats'], link: 'stands'},
    {id: 'dimensions', theme: 'stands', visual: 'bars', sources: ['stats'], link: 'floorPlan'},
    {id: 'freeStands', theme: 'stands', visual: 'stack', sources: ['dashboard', 'floorPlans'], link: 'floorPlan'},
    // Thème Programme et logistique
    {id: 'talksPlanned', theme: 'logistics', visual: 'stack', sources: ['dashboard', 'talks']},
    {id: 'meals', theme: 'logistics', visual: 'bars', sources: ['stats']},
    {id: 'volunteers', theme: 'logistics', visual: 'bars', sources: ['volunteers']},
    {id: 'tasks', theme: 'logistics', visual: 'stack', sources: ['tasks']}
];

export const METRIC_BY_ID: Record<string, MetricDef> =
    METRIC_DEFS.reduce<Record<string, MetricDef>>((acc, def) => {
        acc[def.id] = def;
        return acc;
    }, {});

/** Nombre total de métriques (pour « {n} sur 17 »). */
export const METRIC_COUNT = METRIC_DEFS.length;

/** Identifiants valides, pour ignorer les identifiants inconnus lus du stockage. */
export const METRIC_IDS: ReadonlySet<string> = new Set(METRIC_DEFS.map(def => def.id));

/** Garde l'ordre canonique du catalogue et retire les identifiants inconnus. */
export function sanitizeMetrics(ids: readonly string[]): string[] {
    const chosen = new Set(ids.filter(id => METRIC_IDS.has(id)));
    return METRIC_DEFS.filter(def => chosen.has(def.id)).map(def => def.id);
}

/** Métriques choisies regroupées par thème, dans l'ordre des thèmes puis du catalogue. */
export function groupMetricsByTheme(ids: readonly string[]): {theme: DashboardTheme; ids: string[]}[] {
    const chosen = sanitizeMetrics(ids);
    return THEME_ORDER
        .map(theme => ({theme, ids: chosen.filter(id => METRIC_BY_ID[id]?.theme === theme)}))
        .filter(zone => zone.ids.length > 0);
}

/** Sources à charger pour un ensemble de métriques choisies (+ chronologie et « À traiter »). */
export function sourcesFor(ids: readonly string[]): Set<DashboardSource> {
    // La chronologie et « À traiter » ont toujours besoin de ces sources.
    const sources = new Set<DashboardSource>(['participations', 'stats', 'dashboard', 'tasks']);
    for (const id of ids) {
        METRIC_BY_ID[id]?.sources.forEach(source => sources.add(source));
    }
    return sources;
}
