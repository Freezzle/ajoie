import { IAddress } from '../../common/address.model';

export interface IExhibitor {
  id: string;
  fullName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  npaLocalite?: string | null;
  extraInformation?: string | null;
  language?: string | null;
  differentBillingAddress: boolean;
  billingAddress?: IAddress | null;
}

export type NewExhibitor = Omit<IExhibitor, 'id'> & { id: null };

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
