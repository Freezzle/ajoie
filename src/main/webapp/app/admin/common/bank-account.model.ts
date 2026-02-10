export interface IBankAccount {
    id: string;
    iban: string;
    accountHolder: string;
    bic?: string | null;
}

export type NewBankAccount = Omit<IBankAccount, 'id'> & { id: null };
