export interface IDimensionStand {
  id: string;
  dimension?: string | null;
  heightMeter: number;
  widthMeter: number;
}

export type NewDimensionStand = Omit<IDimensionStand, 'id'> & { id: null };

export function sortDimensionStand(dimensionStands: IDimensionStand[]): IDimensionStand[] {
  return dimensionStands.sort((a, b) => {
    if (a?.widthMeter === b?.widthMeter) {
      return a?.heightMeter ?? 0 - (b?.heightMeter ?? 0);
    }
    return (a?.widthMeter ?? 0) - (b?.widthMeter ?? 0);
  });
}
