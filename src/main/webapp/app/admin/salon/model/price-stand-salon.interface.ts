export interface IPriceStandSalon {
    id: string;
    price: number;
    dimension: string;
    heightMeter: number;
    widthMeter: number;
}

export function sortPriceStandSalon(priceStands: IPriceStandSalon[]): IPriceStandSalon[] {
    return priceStands.sort((a, b) => {
        const widthA = a?.widthMeter ?? 0;
        const widthB = b?.widthMeter ?? 0;
        const heightA = a?.heightMeter ?? 0;
        const heightB = b?.heightMeter ?? 0;
        const nameA = a?.dimension?.toLowerCase() ?? '';
        const nameB = b?.dimension?.toLowerCase() ?? '';

        if (widthA !== widthB) {
            return widthA - widthB;
        }
        if (heightA !== heightB) {
            return heightA - heightB;
        }
        return nameB.localeCompare(nameA, 'fr', {numeric: true});
    });
}

export function formatterDimensionStand(dimension: IPriceStandSalon | null): string {
    return dimension?.dimension ?? '';
}

export function selectFilterDimension(): string {
    return 'dimension';
}