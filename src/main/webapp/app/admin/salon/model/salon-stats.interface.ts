export interface ISalonStats {
  dimensionStands: Record<string, number>;
  nbConference: number;
  nbStands: number;
  nbMeal1: number;
  nbMeal2: number;
  nbMeal3: number;
  nbGuestOfHonor: number;
  nbCrushOfHeart: number;
  standInfo: {
    nbTable: number;
    nbChair: number;
    nbElectricity: number;
    nbOffer: number;
  };
  categoriesStands: Record<string, number>;
  facturation: {
    paid: number;
    discount: number;
    expected: number;
  };
}
