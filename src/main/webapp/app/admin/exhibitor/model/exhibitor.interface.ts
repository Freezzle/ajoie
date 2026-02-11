import {IAddress} from '../../common/address.model';
import {IBankAccount} from '../../common/bank-account.model';

export interface IExhibitor {
    id: string;

    firstName: string;
    lastName: string;
    email: string;
    language: string;
    differentBillingAddress: boolean;
    newsletter: boolean;
    redFlag: boolean;
    duplicateDetected: boolean;

    phoneNumber: string | null;
    homeAddress: IAddress | null;
    extraInformation: string | null;
    billingAddress: IAddress | null;
    bankAccount: IBankAccount | null;
}

export function getExhibitorFullName(exhibitor: IExhibitor | null | undefined): string {
    if (!exhibitor) {
        return '';
    }
    return `${exhibitor.firstName} ${exhibitor.lastName}`;
}

export function getFirstExhibitorName(exhibitor: IExhibitor | null | undefined): string {
    return getExhibitorFullName(exhibitor);
}

export function selectFilterExhibitor(): string {
    return 'firstName,lastName,email';
}
