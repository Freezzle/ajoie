import {ISalon} from '../../salon/model/salon.interface';
import {Status} from '../../enumerations/status.model';
import {IExhibitor, selectFilterExhibitor, getExhibitorFullName} from '../../exhibitor/model/exhibitor.interface';
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

/**
 * Participation enrichie renvoyée par la liste d'un salon : compteurs de prestations
 * et de factures, pour afficher le pied de chaque ligne sans requête supplémentaire.
 */
export interface IParticipationList extends IParticipation, IInfoInvoice {
    nbStands: number;
    nbSharedStands: number;
    nbConferences: number;
    nbWorkshops: number;
}

export function containsParticipationName(
  participation: IParticipation | null,
  filterText: string,
): boolean {
  if (!participation || !filterText) {
    return false;
  }

  filterText = filterText.trim()?.toLocaleLowerCase();

  const exhibitorName = getExhibitorFullName(participation.exhibitor).toLocaleLowerCase();

  return (
    (exhibitorName.includes(filterText) ||
      participation.therapistName?.toLocaleLowerCase().includes(filterText)) ??
    false
  );
}

export function getOnlyParticipationName(
  participation: IParticipation | null | undefined,
): string {
  if (!participation) {
    return '-';
  }

  const exhibitorName = getExhibitorFullName(participation.exhibitor);

  if (participation?.therapistName) {
    return `${participation?.therapistName}`;
  }

  return `- (${exhibitorName})`;
}

export function getFormattedParticipationName(participation: IParticipation | null | undefined): string {
    if (!participation) {
        return '-';
    }

    const exhibitorName = getExhibitorFullName(participation.exhibitor);

    if (participation?.therapistName) {
        return `${participation?.therapistName} (${exhibitorName})`;
    }
    return `- (${exhibitorName})`;
}

export function selectFilterParticipation(): string {
    return `therapistName,clientNumber,exhibitor.${selectFilterExhibitor().split(',').join(',exhibitor.')}`;
}
