/**
 * Fonctions pures du tableau de bord d'un salon (docs/feature.md §3, §4, §7).
 *
 * Aucune dépendance Angular : ce fichier calcule les séries de la chronologie, les compteurs
 * « À traiter » et le modèle d'affichage de chaque métrique. Le composant ne fait qu'afficher.
 * Le formatage (CHF, %) reste autant que possible dans le gabarit (pipes `currency` / `translate`).
 */

import {Status} from '../../enumerations/status.model';
import {ModePaymentMeals} from '../../enumerations/mode-payment-meals.model';
import {IParticipationList} from '../../participation/model/participation.interface';
import {hasDraftPredicate, toWatchPredicate} from '../../participation/model/participation-predicates';
import {ISalonStats} from '../model/salon-stats.interface';
import {IDatedAmount, ISalonDashboard} from '../model/salon-dashboard.interface';
import {ITaskInstance} from '../../task/model/task-instance.interface';
import {flatten, isLate, next14Predicate, ownerOf} from '../../task/shared/task-urgency.utils';
import {IFloorPlan} from '../../floor-plan/floor-plan.model';
import {TalkPlanningSaveDto} from '../../talks-planning/update/talks-planning-model';
import {Category, Day} from '../../volunteer-planning/components/volunteer-planning-model';
import {dayStats} from '../../volunteer-planning/components/volunteer-planning-utils';
import {MetricVisual} from './salon-dashboard.metrics';

// ────────────────────────────────────────────────────────────────────────────
// Chronologie (§3)
// ────────────────────────────────────────────────────────────────────────────

/** Une semaine (lundi → dimanche) avec les valeurs cumulées d'inscriptions et de paiements. */
export interface TimelineWeek {
    start: Date;
    registrations: number;
    payments: number;
}

export interface TimelineModel {
    weeks: TimelineWeek[];
    startDate: Date;
    endDate: Date;
    totalRegistrations: number;
}

/** Normalise une valeur de date (chaîne ISO ou `Date`) en `Date`, ou `null`. */
function toDate(value: Date | string | null | undefined): Date | null {
    if (!value) {
        return null;
    }
    const date = value instanceof Date ? value : new Date(value);
    return isNaN(date.getTime()) ? null : date;
}

/** Lundi (minuit local) de la semaine d'une date. */
export function startOfWeekMonday(value: Date): Date {
    const date = new Date(value.getFullYear(), value.getMonth(), value.getDate());
    const offset = (date.getDay() + 6) % 7; // 0 = lundi
    date.setDate(date.getDate() - offset);
    date.setHours(0, 0, 0, 0);
    return date;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Série hebdomadaire de la chronologie (§3.1). La période va de la plus ancienne à la plus
 * récente date — inscriptions et paiements confondus — et ne dépend jamais de la date du jour.
 * Renvoie `null` s'il n'y a aucune date.
 */
export function buildTimeline(
    participations: Pick<IParticipationList, 'registrationDate'>[],
    payments: IDatedAmount[]
): TimelineModel | null {
    const regDates = participations
        .map(participation => toDate(participation.registrationDate))
        .filter((date): date is Date => date !== null);
    const payEntries = payments
        .map(payment => ({date: toDate(payment.date), amount: payment.amount}))
        .filter((entry): entry is {date: Date; amount: number} => entry.date !== null);

    const allTimes = [...regDates.map(date => date.getTime()), ...payEntries.map(entry => entry.date.getTime())];
    if (allTimes.length === 0) {
        return null;
    }

    const startDate = new Date(Math.min(...allTimes));
    const endDate = new Date(Math.max(...allTimes));
    const firstWeek = startOfWeekMonday(startDate);
    const lastWeek = startOfWeekMonday(endDate);
    const count = Math.round((lastWeek.getTime() - firstWeek.getTime()) / WEEK_MS) + 1;

    const regPerWeek = new Array<number>(count).fill(0);
    const payPerWeek = new Array<number>(count).fill(0);
    const weekIndex = (date: Date): number =>
        Math.round((startOfWeekMonday(date).getTime() - firstWeek.getTime()) / WEEK_MS);

    for (const date of regDates) {
        const index = weekIndex(date);
        if (index >= 0 && index < count) {
            regPerWeek[index]++;
        }
    }
    for (const entry of payEntries) {
        const index = weekIndex(entry.date);
        if (index >= 0 && index < count) {
            payPerWeek[index] += entry.amount;
        }
    }

    const weeks: TimelineWeek[] = [];
    let regCumulative = 0;
    let payCumulative = 0;
    for (let i = 0; i < count; i++) {
        regCumulative += regPerWeek[i];
        payCumulative += payPerWeek[i];
        weeks.push({
            start: new Date(firstWeek.getTime() + i * WEEK_MS),
            registrations: regCumulative,
            payments: payCumulative
        });
    }

    return {weeks, startDate, endDate, totalRegistrations: regDates.length};
}

// ────────────────────────────────────────────────────────────────────────────
// Tracé SVG (§3.3)
// ────────────────────────────────────────────────────────────────────────────

export interface ChartPoint {
    x: number;
    y: number;
}

export interface LineChart {
    width: number;
    height: number;
    left: number;
    right: number;
    top: number;
    bottom: number;
    points: ChartPoint[];
    linePath: string;
    areaPath: string;
    yTicks: {y: number; label: string}[];
    xLabels: {x: number; label: string}[];
    last: ChartPoint | null;
    /** Ligne horizontale du montant attendu (paiements uniquement). */
    refLine: {y: number; amount: number} | null;
    color: string;
}

export interface LineChartOptions {
    width: number;
    height: number;
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
    /** Valeurs en CHF : graduations « 2,5 k » et ligne de montant attendu. */
    amount: boolean;
    expected?: number | null;
    monthLabels?: boolean;
    color: string;
    locale?: string;
}

/** Graduation « 2,5 k » pour les montants, nombre brut sinon. */
function formatTick(value: number, amount: boolean, locale: string): string {
    if (!amount) {
        return String(value);
    }
    if (value >= 1000) {
        return `${(value / 1000).toLocaleString(locale)} k`;
    }
    return String(value);
}

/**
 * Construit un graphique en courbe cumulée à partir des semaines de la chronologie. Les deux
 * graphiques partagent le même axe X : mêmes marges, même nombre de semaines, donc même échelle.
 */
export function buildLineChart(weeks: TimelineWeek[], values: number[], options: LineChartOptions): LineChart {
    const locale = options.locale ?? 'fr-CH';
    const width = options.width;
    const height = options.height;
    const left = options.left ?? 36;
    const right = options.right ?? 10;
    const top = options.top ?? 16;
    const bottom = options.bottom ?? (options.monthLabels ? 24 : 8);

    const count = values.length;
    const xOf = (index: number): number =>
        count <= 1 ? left : left + (index / (count - 1)) * (width - left - right);

    const expected = options.amount ? options.expected ?? 0 : 0;
    const top0 = Math.max(expected, ...values, 0);
    const step = options.amount ? (top0 > 8000 ? 2500 : 1000) : (top0 > 20 ? 10 : 5);
    const maxY = Math.max(step, Math.ceil((top0 * 1.08) / step) * step);
    const yOf = (value: number): number => top + (1 - value / maxY) * (height - top - bottom);

    const points = values.map((value, index) => ({x: xOf(index), y: yOf(value)}));
    const linePath = points
        .map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
        .join(' ');
    const baseY = yOf(0);
    const areaPath = points.length
        ? `${linePath} L${points[points.length - 1].x.toFixed(1)} ${baseY.toFixed(1)} L${points[0].x.toFixed(1)} ${baseY.toFixed(1)} Z`
        : '';

    const yTicks: {y: number; label: string}[] = [];
    for (let value = 0; value <= maxY; value += step) {
        yTicks.push({y: yOf(value), label: formatTick(value, options.amount, locale)});
    }

    const xLabels: {x: number; label: string}[] = [];
    if (options.monthLabels && weeks.length > 0) {
        const firstWeek = weeks[0].start;
        const start = weeks[0].start;
        const end = weeks[weeks.length - 1].start;
        const cursor = new Date(start.getFullYear(), start.getMonth() + 1, 1);
        while (cursor <= end) {
            const index = Math.round((startOfWeekMonday(cursor).getTime() - firstWeek.getTime()) / WEEK_MS);
            const clamped = Math.max(0, Math.min(count - 1, index));
            xLabels.push({
                x: xOf(clamped),
                label: cursor.toLocaleDateString(locale, {month: 'short'})
            });
            cursor.setMonth(cursor.getMonth() + 1);
        }
    }

    return {
        width,
        height,
        left,
        right,
        top,
        bottom,
        points,
        linePath,
        areaPath,
        yTicks,
        xLabels,
        last: points.length ? points[points.length - 1] : null,
        refLine: options.amount && expected > 0 ? {y: yOf(expected), amount: expected} : null,
        color: options.color
    };
}

// ────────────────────────────────────────────────────────────────────────────
// À traiter (§4)
// ────────────────────────────────────────────────────────────────────────────

export interface TodoModel {
    toVerify: number;
    toInvoice: number;
    toInvoiceDrafts: number;
    toWatch: number;
    watchBlocked: number;
    watchDuplicate: number;
    watchExpired: number;
    lateTasks: number;
    lateTitles: string[];
    nextTasks: number;
    nextOwners: string[];
}

/** Les cinq compteurs « À traiter » (§4.1), calculés avec les prédicats partagés. */
export function buildTodo(participations: IParticipationList[], tasks: ITaskInstance[]): TodoModel {
    const subtasks = flatten(tasks);
    const late = subtasks.filter(isLate);
    const next = subtasks.filter(next14Predicate);

    const nextOwners: string[] = [];
    for (const subtask of next) {
        const owner = ownerOf(subtask, subtask.parentTask);
        if (owner && !nextOwners.includes(owner)) {
            nextOwners.push(owner);
        }
    }

    return {
        toVerify: participations.filter(participation => participation.status === Status.IN_VERIFICATION).length,
        toInvoice: participations.filter(hasDraftPredicate).length,
        toInvoiceDrafts: participations.reduce((sum, participation) => sum + participation.nbDraft, 0),
        toWatch: participations.filter(toWatchPredicate).length,
        watchBlocked: participations.filter(participation => !!participation.exhibitor?.redFlag).length,
        watchDuplicate: participations.filter(participation => !!participation.exhibitor?.duplicateDetected).length,
        watchExpired: participations.filter(participation => participation.nbExpired > 0).length,
        lateTasks: late.length,
        lateTitles: late.map(subtask => subtask.title),
        nextTasks: next.length,
        nextOwners
    };
}

// ────────────────────────────────────────────────────────────────────────────
// Métriques (§7)
// ────────────────────────────────────────────────────────────────────────────

export type MetricStatusType = 'participation' | 'stand' | 'conference' | 'workshop';

export interface StatusRow {
    status: Status;
    count: number;
    pct: number;
    barWidth: number;
    colorVar: string;
    hatch: boolean;
    filter: string;
}

export interface StatusTypeVM {
    type: MetricStatusType;
    dest: string;
    total: number;
    active: number;
    discarded: number;
    rows: StatusRow[];
}

export interface StackSeg {
    labelKey?: string;
    label?: string;
    value: number;
    colorVar: string;
}

export interface BarRow {
    labelKey?: string;
    label?: string;
    value: number;
    barWidth: number;
    amount: boolean;
    extra?: number;
    suffix?: string;
    colorVar: string;
}

export interface MetricVM {
    id: string;
    visual: MetricVisual;
    warn: boolean;
    financial: boolean;
    link?: 'stands' | 'floorPlan';
    valueKind: 'text' | 'amount' | 'none';
    valueParams?: Record<string, unknown>;
    valueAmount?: number;
    subParams?: Record<string, unknown>;
    segments?: StackSeg[];
    bars?: BarRow[];
    barsLegend?: {ok: number; ver: number};
    status?: StatusTypeVM[];
}

/** Données chargées en parallèle (§8), passées aux constructeurs de métriques. */
export interface DashboardContext {
    participations: IParticipationList[];
    statsVerification: ISalonStats | null;
    statsConfirmed: ISalonStats | null;
    statsDiscarded: ISalonStats | null;
    dashboard: ISalonDashboard | null;
    tasks: ITaskInstance[];
    floorPlans: IFloorPlan[];
    talks: TalkPlanningSaveDto[];
    volunteerDays: Day[];
    volunteerCategories: Category[];
}

const STATUS_ORDER: Status[] = [
    Status.IN_VERIFICATION,
    Status.ACCEPTED,
    Status.VALIDATED,
    Status.CLOSED,
    Status.REFUSED,
    Status.CANCELED
];

const STATUS_COLORS: Record<Status, string> = {
    [Status.IN_VERIFICATION]: 'var(--app-status-verification)',
    [Status.ACCEPTED]: 'var(--app-status-accepted)',
    [Status.VALIDATED]: 'var(--app-status-validated)',
    [Status.CLOSED]: 'var(--app-status-closed)',
    [Status.REFUSED]: 'var(--app-status-refused)',
    [Status.CANCELED]: 'var(--app-status-canceled)'
};

/** Statuts confirmés (§7) : acceptées, validées, clôturées. */
const CONFIRMED_STATUSES: Status[] = [Status.ACCEPTED, Status.VALIDATED, Status.CLOSED];

function isActiveStatus(status: Status): boolean {
    return status !== Status.REFUSED && status !== Status.CANCELED;
}

function roundPct(part: number, whole: number): number {
    return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

/** Barres horizontales : largeur relative au plus grand `value`. */
function withBarWidths(rows: Omit<BarRow, 'barWidth'>[]): BarRow[] {
    const max = Math.max(1, ...rows.map(row => row.value));
    return rows.map(row => ({...row, barWidth: (row.value / max) * 100}));
}

function buildStatusType(
    type: MetricStatusType,
    dest: string,
    counts: Record<Status, number>
): StatusTypeVM {
    const total = STATUS_ORDER.reduce((sum, status) => sum + (counts[status] || 0), 0);
    const max = Math.max(1, ...STATUS_ORDER.map(status => counts[status] || 0));
    const rows: StatusRow[] = STATUS_ORDER.map(status => {
        const count = counts[status] || 0;
        return {
            status,
            count,
            pct: roundPct(count, total),
            barWidth: (count / max) * 100,
            colorVar: STATUS_COLORS[status],
            hatch: status === Status.CANCELED,
            filter: isActiveStatus(status) ? `st_${status}` : 'st_OUT'
        };
    });
    const discarded = (counts[Status.REFUSED] || 0) + (counts[Status.CANCELED] || 0);
    return {type, dest, total, active: total - discarded, discarded, rows};
}

function countParticipationsByStatus(participations: IParticipationList[]): Record<Status, number> {
    const counts = {} as Record<Status, number>;
    for (const status of STATUS_ORDER) {
        counts[status] = 0;
    }
    for (const participation of participations) {
        if (counts[participation.status] !== undefined) {
            counts[participation.status]++;
        }
    }
    return counts;
}

function emptyCounts(): Record<Status, number> {
    const counts = {} as Record<Status, number>;
    for (const status of STATUS_ORDER) {
        counts[status] = 0;
    }
    return counts;
}

function buildStatusMetric(context: DashboardContext): StatusTypeVM[] {
    const dashboard = context.dashboard;
    const standCounts = dashboard?.statusCounts?.['STAND'] ?? emptyCounts();
    const conferenceCounts = dashboard?.statusCounts?.['CONFERENCE'] ?? emptyCounts();
    const workshopCounts = dashboard?.statusCounts?.['WORKSHOP'] ?? emptyCounts();
    return [
        buildStatusType('participation', 'participations', countParticipationsByStatus(context.participations)),
        buildStatusType('stand', 'stands', standCounts),
        buildStatusType('conference', 'conferences', conferenceCounts),
        buildStatusType('workshop', 'workshops', workshopCounts)
    ];
}

/** Lignes « confirmés / en vérification » partagées par Catégories (§7.11) et Dimensions (§7.12). */
function gaugeRows(
    confirmed: Record<string, number>,
    verification: Record<string, number>,
    labelKey: ((key: string) => string) | null
): {bars: BarRow[]; legend: {ok: number; ver: number}} {
    const keys = new Set([...Object.keys(confirmed), ...Object.keys(verification)]);
    const entries = [...keys]
        .map(key => ({key, ok: confirmed[key] ?? 0, ver: verification[key] ?? 0}))
        .filter(entry => entry.ok + entry.ver > 0)
        .sort((a, b) => b.ok - a.ok);
    const max = Math.max(1, ...entries.map(entry => entry.ok));
    const bars: BarRow[] = entries.map(entry => ({
        labelKey: labelKey ? labelKey(entry.key) : undefined,
        label: labelKey ? undefined : entry.key,
        value: entry.ok,
        barWidth: (entry.ok / max) * 100,
        amount: false,
        extra: entry.ver > 0 ? entry.ver : undefined,
        colorVar: 'var(--app-status-validated)'
    }));
    return {
        bars,
        legend: {
            ok: entries.reduce((sum, entry) => sum + entry.ok, 0),
            ver: entries.reduce((sum, entry) => sum + entry.ver, 0)
        }
    };
}

/** Un stand est « placé » si son id apparaît dans un emplacement d'un plan de salle (§7.13). */
export function placedStandIds(floorPlans: IFloorPlan[]): Set<string> {
    const ids = new Set<string>();
    for (const plan of floorPlans) {
        for (const location of plan.locations) {
            if (location.stand?.id) {
                ids.add(location.stand.id);
            }
        }
    }
    return ids;
}

/** Ids des interventions planifiées (jour + salle + heure) dans le planning (§7.14). */
export function plannedTalkIds(talks: TalkPlanningSaveDto[]): Set<string> {
    const ids = new Set<string>();
    for (const talk of talks) {
        if (talk.dayId && talk.roomId && talk.startingHour) {
            ids.add(String(talk.id));
        }
    }
    return ids;
}

/** Couverture pondérée des bénévoles (§7.16). */
export function volunteerCoverage(days: Day[], categories: Category[]): {
    percent: number;
    missing: number;
    byDay: {label: string; percent: number}[];
} {
    let demandedTotal = 0;
    let weighted = 0;
    let missing = 0;
    const byDay: {label: string; percent: number}[] = [];
    for (const day of days) {
        const stats = dayStats(day, categories);
        const demanded = (day.needs ?? []).reduce((sum, need) => sum + Math.max(0, need.min), 0);
        demandedTotal += demanded;
        weighted += stats.coveragePct * demanded;
        missing += stats.missingPlaces;
        byDay.push({label: day.label, percent: stats.coveragePct});
    }
    return {
        percent: demandedTotal > 0 ? Math.round(weighted / demandedTotal) : 100,
        missing,
        byDay
    };
}

const REVENUE_ORDER = ['STAND', 'SHARED', 'CONFERENCE', 'WORKSHOP', 'MEALS', 'ELECTRICITY', 'POSTAL_FEE', 'OTHERS'];

/**
 * Modèle d'affichage d'une métrique (§7). Renvoie `null` si les données nécessaires manquent
 * encore — le composant affiche alors un indicateur de chargement.
 */
export function buildMetric(id: string, context: DashboardContext, visual: MetricVisual): MetricVM | null {
    const dashboard = context.dashboard;
    const confirmed = context.statsConfirmed;
    const verification = context.statsVerification;

    const base = (partial: Partial<MetricVM>): MetricVM => ({
        id,
        visual,
        warn: false,
        financial: false,
        valueKind: 'text',
        ...partial
    });

    switch (id) {
        case 'status':
            if (!dashboard) {
                return null;
            }
            return base({valueKind: 'none', status: buildStatusMetric(context)});

        case 'loyalty': {
            if (!dashboard) {
                return null;
            }
            return base({
                valueParams: {n: dashboard.loyalReturning},
                subParams: {m: dashboard.loyalNew},
                segments: [
                    {labelKey: 'salon.dashboard.metric.loyalty.returning', value: dashboard.loyalReturning, colorVar: 'var(--app-accent)'},
                    {labelKey: 'salon.dashboard.metric.loyalty.new', value: dashboard.loyalNew, colorVar: 'var(--app-border)'}
                ]
            });
        }

        case 'channel': {
            const online = context.participations.filter(participation => participation.publicRegistration).length;
            const admin = context.participations.length - online;
            return base({
                valueParams: {n: online},
                subParams: {m: admin},
                segments: [
                    {labelKey: 'salon.dashboard.metric.channel.online', value: online, colorVar: 'var(--app-accent)'},
                    {labelKey: 'salon.dashboard.metric.channel.admin', value: admin, colorVar: 'var(--app-border)'}
                ]
            });
        }

        case 'verificationDelay': {
            if (!dashboard) {
                return null;
            }
            const stats = dashboard.verificationDelay;
            return base({
                valueParams: {n: stats.medianDays ?? '—'},
                bars: withBarWidths([
                    {labelKey: 'salon.dashboard.bucket.verif0', value: stats.buckets[0] ?? 0, amount: false, colorVar: 'var(--app-accent)'},
                    {labelKey: 'salon.dashboard.bucket.verif1', value: stats.buckets[1] ?? 0, amount: false, colorVar: 'var(--app-accent)'},
                    {labelKey: 'salon.dashboard.bucket.verif2', value: stats.buckets[2] ?? 0, amount: false, colorVar: 'var(--app-accent)'},
                    {labelKey: 'salon.dashboard.bucket.verif3', value: stats.buckets[3] ?? 0, amount: false, colorVar: 'var(--app-accent)'}
                ])
            });
        }

        case 'revenueByService': {
            if (!dashboard) {
                return null;
            }
            const revenue = dashboard.revenueByService;
            const total = Object.values(revenue).reduce((sum, amount) => sum + amount, 0);
            const bars = withBarWidths(
                REVENUE_ORDER.map(key => ({
                    labelKey: `salon.dashboard.service.${key}`,
                    value: revenue[key] ?? 0,
                    amount: true,
                    colorVar: 'var(--app-accent)'
                })).filter(row => row.value > 0).sort((a, b) => b.value - a.value)
            );
            return base({valueKind: 'amount', valueAmount: total, financial: true, bars});
        }

        case 'discounts': {
            if (!confirmed) {
                return null;
            }
            const {discount, total} = confirmed.facturation;
            return base({
                valueKind: 'amount',
                valueAmount: discount,
                financial: true,
                subParams: {x: roundPct(discount, total)}
            });
        }

        case 'paymentDelay': {
            if (!dashboard) {
                return null;
            }
            const stats = dashboard.paymentDelay;
            return base({
                valueParams: {n: stats.medianDays ?? '—'},
                bars: withBarWidths([
                    {labelKey: 'salon.dashboard.bucket.pay0', value: stats.buckets[0] ?? 0, amount: false, colorVar: 'var(--app-accent)'},
                    {labelKey: 'salon.dashboard.bucket.pay1', value: stats.buckets[1] ?? 0, amount: false, colorVar: 'var(--app-accent)'},
                    {labelKey: 'salon.dashboard.bucket.pay2', value: stats.buckets[2] ?? 0, amount: false, colorVar: 'var(--app-accent)'}
                ])
            });
        }

        case 'mealPayment': {
            const active = context.participations.filter(
                participation => isActiveStatus(participation.status)
                    && participation.nbMeal1 + participation.nbMeal2 + participation.nbMeal3 > 0
            );
            const withInvoice = active.filter(participation => participation.modePaymentMeals === ModePaymentMeals.MIXED).length;
            const onSite = active.filter(participation => participation.modePaymentMeals === ModePaymentMeals.SEPARATE).length;
            return base({
                valueParams: {n: withInvoice},
                subParams: {m: onSite},
                segments: [
                    {labelKey: 'participation.modePaymentMeals.list.MIXED', value: withInvoice, colorVar: 'var(--app-accent)'},
                    {labelKey: 'participation.modePaymentMeals.list.SEPARATE', value: onSite, colorVar: 'var(--app-border)'}
                ]
            });
        }

        case 'billingProgress': {
            if (!dashboard) {
                return null;
            }
            const progress = dashboard.billingProgress;
            const draft = progress['DRAFT'] ?? 0;
            const issued = progress['ISSUED'] ?? 0;
            const partial = progress['PARTIAL'] ?? 0;
            const paid = progress['PAID'] ?? 0;
            const total = draft + issued + partial + paid;
            return base({
                valueParams: {done: paid, total},
                bars: withBarWidths([
                    {labelKey: 'salon.dashboard.billing.DRAFT', value: draft, amount: false, colorVar: 'var(--app-accent)'},
                    {labelKey: 'salon.dashboard.billing.ISSUED', value: issued, amount: false, colorVar: 'var(--app-accent)'},
                    {labelKey: 'salon.dashboard.billing.PARTIAL', value: partial, amount: false, colorVar: 'var(--app-accent)'},
                    {labelKey: 'salon.dashboard.billing.PAID', value: paid, amount: false, colorVar: 'var(--app-accent)'}
                ])
            });
        }

        case 'receivablesAging': {
            if (!dashboard) {
                return null;
            }
            const aging = dashboard.receivables;
            const overdue = aging.overdueUnder30 + aging.overdueOver30;
            const total = aging.notDue + overdue;
            return base({
                valueKind: 'amount',
                valueAmount: total,
                financial: true,
                warn: overdue > 0,
                subParams: {amount: overdue},
                bars: withBarWidths([
                    {labelKey: 'salon.dashboard.aging.notDue', value: aging.notDue, amount: true, colorVar: 'var(--app-accent)'},
                    {labelKey: 'salon.dashboard.aging.under30', value: aging.overdueUnder30, amount: true, colorVar: 'var(--app-warn)'},
                    {labelKey: 'salon.dashboard.aging.over30', value: aging.overdueOver30, amount: true, colorVar: 'var(--app-danger)'}
                ])
            });
        }

        case 'categories': {
            if (!confirmed || !verification) {
                return null;
            }
            const {bars, legend} = gaugeRows(
                confirmed.categoriesStands,
                verification.categoriesStands,
                key => `stand.category.list.${key}`
            );
            return base({valueKind: 'none', link: 'stands', bars, barsLegend: legend});
        }

        case 'dimensions': {
            if (!confirmed || !verification) {
                return null;
            }
            const {bars, legend} = gaugeRows(confirmed.dimensionStands, verification.dimensionStands, null);
            return base({valueKind: 'none', link: 'floorPlan', bars, barsLegend: legend});
        }

        case 'freeStands': {
            if (!dashboard) {
                return null;
            }
            const placed = placedStandIds(context.floorPlans);
            const confirmedIds = dashboard.confirmedStandIds;
            const placedCount = confirmedIds.filter(standId => placed.has(standId)).length;
            const free = confirmedIds.length - placedCount;
            return base({
                valueParams: {n: free},
                warn: free > 0,
                link: 'floorPlan',
                subParams: {n: confirmedIds.length},
                segments: [
                    {labelKey: 'salon.dashboard.metric.freeStands.placed', value: placedCount, colorVar: 'var(--app-status-validated)'},
                    {labelKey: 'salon.dashboard.metric.freeStands.unplaced', value: free, colorVar: 'var(--app-danger)'}
                ]
            });
        }

        case 'talksPlanned': {
            if (!dashboard) {
                return null;
            }
            const planned = plannedTalkIds(context.talks);
            const confirmedIds = dashboard.confirmedTalkIds;
            const plannedCount = confirmedIds.filter(talkId => planned.has(String(talkId))).length;
            const withoutSlot = confirmedIds.length - plannedCount;
            return base({
                valueParams: {done: plannedCount, total: confirmedIds.length},
                segments: [
                    {labelKey: 'salon.dashboard.metric.talksPlanned.planned', value: plannedCount, colorVar: 'var(--app-accent)'},
                    {labelKey: 'salon.dashboard.metric.talksPlanned.unplanned', value: withoutSlot, colorVar: 'var(--app-border)'}
                ]
            });
        }

        case 'meals': {
            if (!confirmed) {
                return null;
            }
            const total = confirmed.nbMeal1 + confirmed.nbMeal2 + confirmed.nbMeal3;
            return base({
                valueParams: {n: total},
                bars: withBarWidths([
                    {labelKey: 'salon.stats.meal1', value: confirmed.nbMeal1, amount: false, colorVar: 'var(--app-accent)'},
                    {labelKey: 'salon.stats.meal2', value: confirmed.nbMeal2, amount: false, colorVar: 'var(--app-accent)'},
                    {labelKey: 'salon.stats.meal3', value: confirmed.nbMeal3, amount: false, colorVar: 'var(--app-accent)'}
                ])
            });
        }

        case 'volunteers': {
            const coverage = volunteerCoverage(context.volunteerDays, context.volunteerCategories);
            return base({
                valueParams: {n: coverage.percent},
                warn: coverage.missing > 0,
                subParams: {n: coverage.missing},
                bars: withBarWidths(
                    coverage.byDay.map(day => ({
                        label: day.label,
                        value: day.percent,
                        amount: false,
                        suffix: ' %',
                        colorVar: 'var(--app-accent)'
                    }))
                )
            });
        }

        case 'tasks': {
            const subtasks = flatten(context.tasks).filter(subtask => subtask.status !== 'CANCELLED');
            const done = subtasks.filter(subtask => subtask.status === 'DONE').length;
            const late = subtasks.filter(isLate).length;
            const total = subtasks.length;
            const todo = total - done - late;
            return base({
                valueParams: {done, total},
                segments: [
                    {labelKey: 'salon.dashboard.metric.tasks.done', value: done, colorVar: 'var(--app-status-validated)'},
                    {labelKey: 'salon.dashboard.metric.tasks.todo', value: todo, colorVar: 'var(--app-primary)'},
                    {labelKey: 'salon.dashboard.metric.tasks.late', value: late, colorVar: 'var(--app-danger)'}
                ]
            });
        }

        default:
            return null;
    }
}
