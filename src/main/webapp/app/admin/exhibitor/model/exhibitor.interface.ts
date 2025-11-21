import {IAddress} from '../../common/address.model';

export interface IExhibitor {
    id: string;

    fullName: string;
    email: string;
    language: string;
    differentBillingAddress: boolean;
    newsletter: boolean;
    redFlag: boolean;
    duplicateDetected: boolean;

    phoneNumber: string | null;
    address: string | null;
    npaLocalite: string | null;
    isoCountry: string | null;
    extraInformation: string | null;
    billingAddress: IAddress | null;
}

export function containsExhibitorName(exhibitor: IExhibitor | undefined | null, filterText: string): boolean {
    if (!exhibitor || !filterText) {
        return false;
    }

    filterText = filterText.trim()?.toLocaleLowerCase();

    return exhibitor.fullName?.toLocaleLowerCase().includes(filterText) ?? false;
}

export function getFirstExhibitorName(exhibitor: IExhibitor | null | undefined): string {
    return exhibitor?.fullName ?? '';
}

export function selectFilterExhibitor(): string {
    return 'fullName,email';
}
