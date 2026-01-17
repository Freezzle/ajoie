import {ISalon} from '../../salon/model/salon.interface';
import {Status} from '../../enumerations/status.model';
import {IExhibitor, selectFilterExhibitor} from '../../exhibitor/model/exhibitor.interface';
import {ModePaymentMeals} from '../../enumerations/mode-payment-meals.model';
import {InvoiceSendingMethod} from '../../enumerations/invoice-sending-method.model';

export interface IParticipation {
    id: string;
    registrationDate: Date | null;
    therapistName: string;
    modePaymentMeals: ModePaymentMeals;
    invoiceSendingMethod: InvoiceSendingMethod;
    clientNumber: string | null;
    nbMeal1: number;
    nbMeal2: number;
    nbMeal3: number;
    acceptedChart: boolean;
    acceptedContract: boolean;
    needArrangement: boolean;
    hasOffer: boolean;
    offer: string | null;
    guestOfHonor: boolean;
    crushOfHeart: boolean;
    additionnalInformation: string | null;
    status: Status;
    extraInformation: string | null;
    exhibitor: IExhibitor;
    salon: ISalon;
    ratingFriendliness: number;
    ratingPaymentSpeed: number;
    ratingServiceQuality: number;
}

export interface IInfoInvoice {
    nbDraft: number;
    nbIssued: number;
    nbPaid: number;
    nbExpired: number;
}

export function containsParticipationName(participation: IParticipation | null,
                                          filterText: string): boolean {
    if (!participation || !filterText) {
        return false;
    }

    filterText = filterText.trim()?.toLocaleLowerCase();

    return (
        (participation.exhibitor?.fullName?.toLocaleLowerCase().includes(filterText) ||
         participation.therapistName?.toLocaleLowerCase().includes(filterText)) ??
        false
    );
}

export function getFormattedParticipationName(participation: IParticipation | null | undefined): string {
    if (!participation) {
        return '-';
    }

    if (participation?.therapistName) {
        return `${participation?.therapistName} (${participation.exhibitor?.fullName})`;
    }
    return `- (${participation.exhibitor?.fullName})`;
}

export function selectFilterParticipation(): string {
    return `therapistName,clientNumber,exhibitor.${selectFilterExhibitor().split(',').join(',exhibitor.')}`;
}
