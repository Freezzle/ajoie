/*
 Languages codes are ISO_639-1 codes, see http://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
 They are written in English to avoid character encoding issues (not a perfect solution)
 */
export const LANGUAGES: string[] = [
    'fr',
    'en',
    'de',
];


export function formatterLanguage(language: string | null): string {
    return 'exhibitor.language.list.' + language;
}
