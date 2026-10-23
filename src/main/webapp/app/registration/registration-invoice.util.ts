import {formatterInvoiceMethod, InvoiceSendingMethod} from '../admin/enumerations/invoice-sending-method.model';

/**
 * Clé de traduction du mode d'envoi de la facture pour le formulaire public.
 * L'envoi postal est libellé selon l'adresse réellement utilisée : adresse de facturation
 * si l'exposant en a saisi une, sinon adresse de courrier.
 */
export function registrationInvoiceMethodKey(method: InvoiceSendingMethod | null,
                                             hasBillingAddress: boolean): string {
    if (method === InvoiceSendingMethod.POSTAL && !hasBillingAddress) {
        return 'registration.participation.invoicePostalHome';
    }
    return formatterInvoiceMethod(method);
}
