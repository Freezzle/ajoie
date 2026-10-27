/**
 * Outils de normalisation du HTML produit par l'éditeur riche (`p-editor` / Quill).
 *
 * Problème traité : un `contenteditable` (et plus encore un copier-coller depuis Word/PDF) insère des
 * espaces insécables (`&nbsp;`, U+00A0, U+202F). Pour le moteur de rendu, une phrase reliée par des
 * insécables est un unique « mot » : comme il dépasse la largeur du conteneur, `overflow-wrap:
 * break-word` le coupe à un endroit arbitraire, ce qui renvoie des lettres isolées à la ligne.
 * On rétablit donc des espaces normales, sauf autour de la ponctuation haute française où le groupe
 * reste court et ne peut pas provoquer de coupure.
 */

/** Espaces insécables rencontrées dans le HTML de l'éditeur (entité, U+00A0, U+202F, U+2007). */
const NO_BREAK_SPACES = /&nbsp;|&#160;|&#xA0;|[\u00A0\u202F\u2007]/gi;

/** Ponctuation française précédée d'une espace insécable. */
const PUNCTUATION_AFTER = /[ ]+([:;!?»])/g;

/** Guillemet ouvrant français suivi d'une espace insécable. */
const PUNCTUATION_BEFORE = /(«)[ ]+/g;

/** Découpe le HTML en segments : balises (indice impair) et texte (indice pair). */
const TAG_SPLIT = /(<[^>]*>)/;

function normalizeTextSegment(text: string): string {
    return text
        .replace(NO_BREAK_SPACES, ' ')
        .replace(PUNCTUATION_AFTER, '\u00A0$1')
        .replace(PUNCTUATION_BEFORE, '$1\u00A0');
}

/**
 * Remplace les espaces insécables du contenu textuel par des espaces normales, sans toucher aux
 * balises ni à leurs attributs.
 */
export function normalizeRichTextHtml(html: string): string {
    return html
        .split(TAG_SPLIT)
        .map(segment => segment.startsWith('<') ? segment : normalizeTextSegment(segment))
        .join('');
}

/** `true` si le HTML ne contient ni texte ni média (ex. `<p><br></p>` enregistré par l'éditeur). */
export function isRichTextEmpty(html: string | null | undefined): boolean {
    if (!html) {
        return true;
    }
    if (/<(img|iframe|video|audio|table)\b/i.test(html)) {
        return false;
    }
    return html.replace(/<[^>]*>/g, '').replace(NO_BREAK_SPACES, ' ').trim().length === 0;
}

/**
 * Prépare un HTML d'éditeur riche pour l'injection via `[innerHTML]`.
 * Retourne `null` lorsque le contenu est vide, afin de masquer le bloc associé.
 */
export function prepareRichTextHtml(html: string | null | undefined): string | null {
    return isRichTextEmpty(html) ? null : normalizeRichTextHtml(html!);
}
