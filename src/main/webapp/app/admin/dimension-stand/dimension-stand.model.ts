export interface IDimensionStand {
  id: string;
  dimension?: string | null;
}

export type NewDimensionStand = Omit<IDimensionStand, 'id'> & { id: null };
