export interface IExhibitor {
  id: string;
  fullName?: string | null;
  therapistName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  npaLocalite?: string | null;
  extraInformation?: string | null;
  language?: string | null;
}

export type NewExhibitor = Omit<IExhibitor, 'id'> & { id: null };

export function containExhibitorName(
  exhibitor: IExhibitor | undefined | null,
  filterText: string,
): boolean {
  if (!exhibitor || !filterText) {
    return false;
  }

  filterText = filterText.trim()?.toLocaleLowerCase();

  return (
    (exhibitor.fullName?.toLocaleLowerCase().includes(filterText) ||
     exhibitor.therapistName?.toLocaleLowerCase().includes(filterText)) ??
    false
  );
}

export function getExhibitorName(exhibitor: IExhibitor | null | undefined): string {
  return exhibitor?.therapistName ?? exhibitor?.fullName ?? '';
}

export function getFirstExhibitorName(exhibitor: IExhibitor | null | undefined): string {
  return exhibitor?.fullName ?? exhibitor?.therapistName ?? '';
}

export function getFullExhibitorName(exhibitor: IExhibitor | null | undefined): string {
  return `${exhibitor?.therapistName || ''} - ${exhibitor?.fullName || ''}`;
}

export function getFormattedExhibitorName(exhibitor: IExhibitor | null | undefined): string {
  if (!exhibitor) {
    return '-';
  }

  if (exhibitor?.therapistName) {
    return `${exhibitor?.therapistName} (${exhibitor?.fullName})`;
  }
  return `- (${exhibitor?.fullName})`;
}
