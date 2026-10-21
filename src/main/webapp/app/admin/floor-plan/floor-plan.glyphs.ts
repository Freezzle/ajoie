import {IconDefinition} from '@fortawesome/free-solid-svg-icons';
import {
    faArrowsLeftRight,
    faBan,
    faBolt,
    faCalendarCheck,
    faChair,
    faCheck,
    faClone,
    faCube,
    faHourglassHalf,
    faPeopleArrows,
    faPiggyBank,
    faTag,
    faTimesCircle
} from '@fortawesome/free-solid-svg-icons';
import {Status} from '../enumerations/status.model';

/**
 * Icône FontAwesome prête à être dessinée dans le SVG du plan : un `<svg viewBox>` imbriqué
 * portant le chemin de l'icône.
 */
export interface SvgGlyph {
    viewBox: string;
    path: string;
}

export function toGlyph(icon: IconDefinition): SvgGlyph {
    const [width, height, , , path] = icon.icon;
    return {
        viewBox: `0 0 ${width} ${height}`,
        path: Array.isArray(path) ? path[path.length - 1] : path
    };
}

/** Même icône que celle choisie par le pipe `status`. */
export function statusGlyph(status: Status | null | undefined): SvgGlyph | null {
    switch (status) {
        case Status.ACCEPTED:
            return toGlyph(faCheck);
        case Status.REFUSED:
            return toGlyph(faBan);
        case Status.IN_VERIFICATION:
            return toGlyph(faHourglassHalf);
        case Status.CANCELED:
            return toGlyph(faTimesCircle);
        case Status.VALIDATED:
            return toGlyph(faCalendarCheck);
        case Status.CLOSED:
            return toGlyph(faPiggyBank);
        default:
            return null;
    }
}

export const GLYPH_OVERLAP = toGlyph(faClone);
export const GLYPH_SIZE_MISMATCH = toGlyph(faArrowsLeftRight);
export const GLYPH_PRERESERVED = toGlyph(faTag);
export const GLYPH_SHARED = toGlyph(faPeopleArrows);
export const GLYPH_ELECTRICITY = toGlyph(faBolt);
export const GLYPH_CHAIR = toGlyph(faChair);
export const GLYPH_TABLE = toGlyph(faCube);
