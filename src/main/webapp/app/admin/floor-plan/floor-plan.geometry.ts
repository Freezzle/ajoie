/**
 * Géométrie du plan de la salle. Tout est exprimé en mètres.
 *
 * Un rectangle est décrit par son coin haut-gauche avant rotation (`x`, `y`), sa largeur (`w`),
 * sa profondeur (`h`) et un angle horaire `rot` en degrés appliqué autour de son centre.
 */

/** Tolérance pour que deux objets bord à bord ne soient pas considérés en conflit. */
export const EPS = 0.01;

/** Seuil de l'aimant, en mètres. */
export const MAGNET_THRESHOLD = 0.35;

/** Pas de repli quand le calage est désactivé, en mètres. */
export const FREE_STEP = 0.05;

/** Tolérance d'attraction de l'angle vers 0 / 90 / 180 / 270°, en degrés. */
export const ANGLE_MAGNET_DEG = 4;

export interface Point {
    x: number;
    y: number;
}

export interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
    rot?: number;
}

export interface Bounds {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
}

export function toRadians(deg: number): number {
    return (deg * Math.PI) / 180;
}

/** Arrondi à 3 décimales, pour éviter les dérives en virgule flottante. */
export function round3(value: number): number {
    return Math.round(value * 1000) / 1000;
}

export function angleOf(rect: Rect): number {
    return rect.rot ?? 0;
}

export function center(rect: Rect): Point {
    return {x: rect.x + rect.w / 2, y: rect.y + rect.h / 2};
}

/** Ramène un angle dans l'intervalle [0, 360[. */
export function normalizeAngle(deg: number): number {
    const normalized = deg % 360;
    return normalized < 0 ? normalized + 360 : normalized;
}

/** Les 4 coins du rectangle, après rotation autour de son centre. */
export function corners(rect: Rect): Point[] {
    const c = center(rect);
    const a = toRadians(angleOf(rect));
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    const hw = rect.w / 2;
    const hh = rect.h / 2;

    return [
        [-hw, -hh],
        [hw, -hh],
        [hw, hh],
        [-hw, hh]
    ].map(([u, v]) => ({
        x: c.x + u * cos - v * sin,
        y: c.y + u * sin + v * cos
    }));
}

/** Boîte englobante alignée aux axes. */
export function aabb(rect: Rect): Bounds {
    const pts = corners(rect);
    return {
        x0: Math.min(...pts.map(p => p.x)),
        y0: Math.min(...pts.map(p => p.y)),
        x1: Math.max(...pts.map(p => p.x)),
        y1: Math.max(...pts.map(p => p.y))
    };
}

function projection(points: Point[], axis: Point): { min: number; max: number } {
    let min = Infinity;
    let max = -Infinity;
    for (const p of points) {
        const value = p.x * axis.x + p.y * axis.y;
        min = Math.min(min, value);
        max = Math.max(max, value);
    }
    return {min, max};
}

/**
 * Test des axes séparateurs (SAT). Deux rectangles bord à bord ne se chevauchent pas grâce à
 * la tolérance `EPS`.
 */
export function overlap(a: Rect, b: Rect): boolean {
    const angleA = angleOf(a);
    const angleB = angleOf(b);

    if (angleA === 0 && angleB === 0) {
        return (
            a.x < b.x + b.w - EPS &&
            b.x < a.x + a.w - EPS &&
            a.y < b.y + b.h - EPS &&
            b.y < a.y + a.h - EPS
        );
    }

    const pointsA = corners(a);
    const pointsB = corners(b);
    const angles = [angleA, angleA + 90, angleB, angleB + 90];

    for (const angle of angles) {
        const rad = toRadians(angle);
        const axis = {x: Math.cos(rad), y: Math.sin(rad)};
        const pa = projection(pointsA, axis);
        const pb = projection(pointsB, axis);
        if (pa.max - EPS <= pb.min || pb.max - EPS <= pa.min) {
            return false;
        }
    }
    return true;
}

/** Le point est-il dans le rectangle ? Le point est ramené dans le repère de l'objet. */
export function inside(point: Point, rect: Rect): boolean {
    const c = center(rect);
    const a = toRadians(-angleOf(rect));
    const dx = point.x - c.x;
    const dy = point.y - c.y;
    const u = dx * Math.cos(a) - dy * Math.sin(a);
    const v = dx * Math.sin(a) + dy * Math.cos(a);
    return Math.abs(u) <= rect.w / 2 && Math.abs(v) <= rect.h / 2;
}

/** Le rectangle sort-il de la salle `[0, widthMeter] × [0, heightMeter]` ? */
export function outOfPlan(rect: Rect, widthMeter: number, heightMeter: number): boolean {
    const box = aabb(rect);
    return (
        box.x0 < -EPS || box.y0 < -EPS || box.x1 > widthMeter + EPS || box.y1 > heightMeter + EPS
    );
}

/** Calage d'une valeur sur le pas de déplacement. */
export function snap(value: number, moveStepMeter: number, enabled = true): number {
    const step = enabled ? moveStepMeter : FREE_STEP;
    return round3(Math.round(value / step) * step);
}

export interface PlacementOptions {
    moveStepMeter: number;
    snapEnabled: boolean;
    magnetEnabled: boolean;
    planWidthMeter: number;
    planHeightMeter: number;
    neighbours: Rect[];
}

/**
 * Place le rectangle à partir d'un centre visé : bornage dans la salle, calage au pas
 * (le coin haut-gauche pour un objet droit, le centre pour un objet en biais), puis aimant.
 * Le rectangle est modifié en place.
 */
export function placeAt(rect: Rect, centerX: number, centerY: number, options: PlacementOptions): Rect {
    const box = aabb({...rect, x: centerX - rect.w / 2, y: centerY - rect.h / 2});
    const halfW = (box.x1 - box.x0) / 2;
    const halfH = (box.y1 - box.y0) / 2;

    const clampedX = clamp(centerX, halfW, Math.max(halfW, options.planWidthMeter - halfW));
    const clampedY = clamp(centerY, halfH, Math.max(halfH, options.planHeightMeter - halfH));

    if (angleOf(rect) === 0) {
        rect.x = snap(clampedX - rect.w / 2, options.moveStepMeter, options.snapEnabled);
        rect.y = snap(clampedY - rect.h / 2, options.moveStepMeter, options.snapEnabled);
    } else {
        const snappedX = snap(clampedX, options.moveStepMeter, options.snapEnabled);
        const snappedY = snap(clampedY, options.moveStepMeter, options.snapEnabled);
        rect.x = round3(snappedX - rect.w / 2);
        rect.y = round3(snappedY - rect.h / 2);
    }

    if (options.magnetEnabled) {
        magnet(rect, options);
    }
    return rect;
}

export function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

/**
 * Colle le rectangle aux bords des voisins de même angle, et aux murs de la salle quand il est
 * droit. Le rectangle est modifié en place.
 */
export function magnet(rect: Rect, options: PlacementOptions): Rect {
    const angle = angleOf(rect);
    const rad = toRadians(angle);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const c = center(rect);

    // Repère local : u le long de la largeur, v le long de la profondeur.
    const toLocal = (p: Point): Point => ({
        x: p.x * cos + p.y * sin,
        y: -p.x * sin + p.y * cos
    });

    const local = toLocal(c);
    let bestU: { delta: number; distance: number } | null = null;
    let bestV: { delta: number; distance: number } | null = null;

    const consider = (candidate: number, current: number, best: typeof bestU): typeof bestU => {
        const distance = Math.abs(candidate - current);
        if (distance > MAGNET_THRESHOLD) {
            return best;
        }
        if (!best || distance < best.distance) {
            return {delta: candidate - current, distance};
        }
        return best;
    };

    for (const neighbour of options.neighbours) {
        if (angleOf(neighbour) !== angle) {
            continue;
        }
        const nLocal = toLocal(center(neighbour));
        const sumU = (rect.w + neighbour.w) / 2;
        const sumV = (rect.h + neighbour.h) / 2;

        for (const candidate of [nLocal.x - sumU, nLocal.x + sumU, nLocal.x]) {
            bestU = consider(candidate, local.x, bestU);
        }
        for (const candidate of [nLocal.y - sumV, nLocal.y + sumV, nLocal.y]) {
            bestV = consider(candidate, local.y, bestV);
        }
    }

    if (angle === 0) {
        bestU = consider(rect.w / 2, local.x, bestU);
        bestU = consider(options.planWidthMeter - rect.w / 2, local.x, bestU);
        bestV = consider(rect.h / 2, local.y, bestV);
        bestV = consider(options.planHeightMeter - rect.h / 2, local.y, bestV);
    }

    if (!bestU && !bestV) {
        return rect;
    }

    const newLocal = {
        x: local.x + (bestU?.delta ?? 0),
        y: local.y + (bestV?.delta ?? 0)
    };
    const newCenter = {
        x: newLocal.x * cos - newLocal.y * sin,
        y: newLocal.x * sin + newLocal.y * cos
    };

    rect.x = round3(newCenter.x - rect.w / 2);
    rect.y = round3(newCenter.y - rect.h / 2);
    return rect;
}

/**
 * Arrondit un angle au pas de rotation, et l'attire vers 0 / 90 / 180 / 270° quand il en est
 * à moins de `ANGLE_MAGNET_DEG`. En mode fin (Maj), la rotation se fait degré par degré.
 */
export function snapAngle(deg: number, rotationStepDeg: number, fine = false): number {
    const step = fine ? 1 : rotationStepDeg;
    let angle = normalizeAngle(Math.round(deg / step) * step);

    for (const quarter of [0, 90, 180, 270, 360]) {
        if (Math.abs(angle - quarter) <= ANGLE_MAGNET_DEG) {
            angle = quarter % 360;
            break;
        }
    }
    return normalizeAngle(angle);
}

/** Angle du vecteur centre → point, en degrés horaires. */
export function angleTo(from: Point, to: Point): number {
    return normalizeAngle((Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI);
}

export interface ReadingFrame {
    /** Contre-rotation à appliquer au texte, multiple de 90°. */
    counterRotation: number;
    /** Largeur utilisable dans le cadre de lecture. */
    width: number;
    /** Hauteur utilisable dans le cadre de lecture. */
    height: number;
}

/**
 * Cadre de lecture : le texte est contre-tourné par multiples de 90° pour rester au plus près
 * de l'horizontale. Un objet étroit laisse le texte suivre sa grande longueur.
 */
export function readingFrame(rect: Rect): ReadingFrame {
    const angle = angleOf(rect);
    const counterRotation = -Math.round(angle / 90) * 90;
    const quarter = Math.abs(counterRotation / 90) % 2 === 1;

    let width = quarter ? rect.h : rect.w;
    let height = quarter ? rect.w : rect.h;

    if (width < 2.2 && width < height * 0.8) {
        [width, height] = [height, width];
        return {counterRotation: counterRotation + 90, width, height};
    }

    return {counterRotation, width, height};
}

/** Convertit un nombre de pixels écran en mètres, au niveau de zoom courant. */
export function pxToMeter(pixels: number, pixelsPerMeter: number): number {
    return pixels / (pixelsPerMeter || 30);
}

/** Borne une taille de texte entre un minimum et un maximum. */
export function fitSize(target: number, lo: number, hi: number): number {
    return Math.min(hi, Math.max(lo, target));
}

/** Tronque un texte pour qu'il tienne dans une largeur, à une taille de police donnée. */
export function cutText(text: string, widthMeter: number, fontSizeMeter: number): string {
    const capacity = Math.floor(widthMeter / (fontSizeMeter * 0.56));
    if (capacity <= 0) {
        return '';
    }
    if (text.length <= capacity) {
        return text;
    }
    return `${text.slice(0, Math.max(1, capacity - 1))}…`;
}

/** Découpe un texte en lignes qui tiennent dans une largeur donnée. */
export function wrapText(text: string, widthMeter: number, fontSizeMeter: number, maxLines: number): string[] {
    const capacity = Math.floor(widthMeter / (fontSizeMeter * 0.56));
    if (capacity <= 0 || maxLines <= 0) {
        return [];
    }

    const lines: string[] = [];
    let current = '';

    for (const word of text.split(/\s+/).filter(Boolean)) {
        const candidate = current ? `${current} ${word}` : word;
        if (candidate.length <= capacity) {
            current = candidate;
            continue;
        }
        if (current) {
            lines.push(current);
        }
        current = word;
        if (lines.length === maxLines) {
            break;
        }
    }

    if (current && lines.length < maxLines) {
        lines.push(current);
    }

    if (lines.length === maxLines) {
        const last = lines[maxLines - 1];
        const remaining = text.split(/\s+/).filter(Boolean).join(' ');
        if (lines.join(' ').length < remaining.length) {
            lines[maxLines - 1] = cutText(`${last}…`, widthMeter, fontSizeMeter);
        }
    }

    return lines.map(line => cutText(line, widthMeter, fontSizeMeter));
}
