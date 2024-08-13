export interface IExponent {
  id: string;
  fullName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  npaLocalite?: string | null;
  extraInformation?: string | null;
}

export type NewExponent = Omit<IExponent, 'id'> & { id: null };
