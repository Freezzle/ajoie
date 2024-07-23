export interface IExponent {
  id: string;
  email?: string | null;
  fullName?: string | null;
  phoneNumber?: string | null;
  website?: string | null;
  socialMedia?: string | null;
  address?: string | null;
  npaLocalite?: string | null;
  urlPicture?: string | null;
  comment?: string | null;
  blocked?: boolean | null;
}

export type NewExponent = Omit<IExponent, 'id'> & { id: null };
