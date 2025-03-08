import dayjs from 'dayjs/esm';
import { ISalon } from '../../salon/model/salon.interface';
import { Status } from '../../enumerations/status.model';
import { Type } from '../../enumerations/type.model';
import { IExhibitor } from '../../exhibitor/model/exhibitor.interface';

export interface IParticipation {
  id: string;
  registrationDate?: dayjs.Dayjs | null;
  therapistName?: string | null;
  type?: keyof typeof Type | null;
  clientNumber?: string | null;
  nbMeal1?: number | null;
  nbMeal2?: number | null;
  nbMeal3?: number | null;
  acceptedChart?: boolean | null;
  acceptedContract?: boolean | null;
  needArrangement?: boolean | null;
  hasOffer?: boolean | null;
  offer?: string | null;
  guestOfHonor?: boolean | null;
  crushOfHeart?: boolean | null;
  additionnalInformation?: string | null;
  status?: keyof typeof Status | null;
  extraInformation?: string | null;
  exhibitor?: IExhibitor | null;
  salon?: ISalon | null;
}

export type NewParticipation = Omit<IParticipation, 'id'> & { id: null };

export interface IInfoInvoice {
  hasDraftInvoices: false;
  hasWaitingInvoices: false;
  hasExpiredInvoices: false;
}

export function containsParticipationName(participation: IParticipation | undefined | null,
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
