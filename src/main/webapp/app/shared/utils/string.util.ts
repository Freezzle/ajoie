export function removeAccents(str: string): string {
    return str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : '';
}
