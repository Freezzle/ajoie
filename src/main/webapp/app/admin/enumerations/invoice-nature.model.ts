/**
 * Nature métier d'une ligne de facture.
 * Le signe du montant découle de la nature : seules les réductions alimentent les statistiques
 * de rabais, les rectifications étant de simples annulations de lignes déjà facturées.
 */
export enum InvoiceNature {
    SERVICE = 'SERVICE',
    REDUCTION = 'REDUCTION',
    CORRECTION = 'CORRECTION',
}

export const INVOICE_NATURES: InvoiceNature[] = [
    InvoiceNature.SERVICE,
    InvoiceNature.REDUCTION,
    InvoiceNature.CORRECTION,
];

export function formatterInvoiceNature(nature: InvoiceNature): string {
    return `invoicingPlan.invoice.nature.list.${nature}`;
}

export function invoiceNatureHintKey(nature: InvoiceNature): string {
    return `invoicingPlan.invoice.nature.hint.${nature}`;
}

/** Une rectification comme une réduction se saisit en positif et s'applique en négatif. */
export function isNegativeNature(nature: InvoiceNature | null | undefined): boolean {
    return nature === InvoiceNature.REDUCTION || nature === InvoiceNature.CORRECTION;
}
