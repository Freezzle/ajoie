export enum InvoiceSendingMethod {
    EMAIL = 'EMAIL',
    POSTAL = 'POSTAL'
}

export function formatterInvoiceMethod(method: InvoiceSendingMethod | null): string {
    return 'participation.invoiceSendingMethod.list.' + method;
}

export function compareInvoiceMethod(o1: InvoiceSendingMethod, o2: InvoiceSendingMethod): boolean {
    return o1 === o2;
}
