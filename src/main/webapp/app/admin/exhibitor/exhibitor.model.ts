export interface IExhibitor {
  id: string;
  fullName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  npaLocalite?: string | null;
  extraInformation?: string | null;
}

export type NewExhibitor = Omit<IExhibitor, 'id'> & { id: null };
