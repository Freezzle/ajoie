import {formatCurrency, getCurrencySymbol} from '@angular/common';
import {TranslateService} from '@ngx-translate/core';

import {IPublicDimension, IRegistrationPrices} from './registration.model';

const LOCALE = 'fr';
const CURRENCY_CODE = 'CHF';

/**
 * Formate un montant en francs suisses, ou retourne null si le prix n'est pas configuré.
 */
export function formatPrice(value: number | null | undefined): string | null {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return null;
    }
    return formatCurrency(value, LOCALE, getCurrencySymbol(CURRENCY_CODE, 'narrow', LOCALE), CURRENCY_CODE);
}

/**
 * Construit un petit libellé de prix traduit, ou null si le prix n'est pas configuré.
 */
export function priceHint(translateService: TranslateService, key: string,
                          price: number | null | undefined): string | null {
    const formatted = formatPrice(price);
    return formatted ? (translateService.instant(key, {price: formatted}) as string) : null;
}

export interface CostLine {
    labelKey: string;
    labelParams?: Record<string, unknown>;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface CostEstimate {
    lines: CostLine[];
    total: number;
}

export interface CostInput {
    prices: IRegistrationPrices | null;
    dimensions: IPublicDimension[];
    standDimensionId: string | null;
    standShared: boolean;
    hasStand: boolean;
    nbConferences: number;
    nbWorkshops: number;
    nbMeal1: number;
    nbMeal2: number;
    nbMeal3: number;
    postalInvoice: boolean;
}

/**
 * Calcule l'estimation du coût d'une inscription.
 * Reproduit la logique de facturation du serveur (RefreshInvoicingPlansService) :
 * stand × 1, stand partagé × 1, conférences et ateliers à l'unité, repas × quantité,
 * et frais fixes d'envoi postal. Les prix non configurés sont ignorés.
 */
export function computeCostEstimate(input: CostInput): CostEstimate {
    const lines: CostLine[] = [];
    const prices = input.prices;

    const push = (labelKey: string, quantity: number, unitPrice: number | null | undefined,
                  labelParams?: Record<string, unknown>): void => {
        if (unitPrice === null || unitPrice === undefined || quantity <= 0) {
            return;
        }
        lines.push({labelKey, labelParams, quantity, unitPrice, total: quantity * unitPrice});
    };

    if (input.hasStand) {
        const dimension = input.dimensions.find(d => d.id === input.standDimensionId);
        push('registration.price.lines.stand', 1, dimension?.price, {dimension: dimension?.dimension ?? ''});

        if (input.standShared) {
            push('registration.price.lines.sharedStand', 1, prices?.priceSharingStand);
        }
    }

    push('registration.price.lines.conference', input.nbConferences, prices?.priceConference);
    push('registration.price.lines.workshop', input.nbWorkshops, prices?.priceWorkshop);
    push('registration.price.lines.meal1', input.nbMeal1, prices?.priceMeal1);
    push('registration.price.lines.meal2', input.nbMeal2, prices?.priceMeal2);
    push('registration.price.lines.meal3', input.nbMeal3, prices?.priceMeal3);

    if (input.postalInvoice) {
        push('registration.price.lines.postalFee', 1, prices?.pricePostalFee);
    }

    return {lines, total: lines.reduce((sum, line) => sum + line.total, 0)};
}
