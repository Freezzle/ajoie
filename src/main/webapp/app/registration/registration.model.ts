import {Category} from '../admin/enumerations/category.model';
import {InvoiceSendingMethod} from '../admin/enumerations/invoice-sending-method.model';
import {ModePaymentMeals} from '../admin/enumerations/mode-payment-meals.model';
import {IAddress} from '../admin/common/address.model';

export interface IPublicDimension {
    id: string;
    dimension: string;
    widthMeter: number | null;
    heightMeter: number | null;
    price: number | null;
}

export interface IRegistrationPrices {
    priceMeal1: number | null;
    priceMeal2: number | null;
    priceMeal3: number | null;
    priceConference: number | null;
    priceWorkshop: number | null;
    priceSharingStand: number | null;
    pricePostalFee: number | null;
}

export type RegistrationClosedReason = 'DISABLED' | 'NOT_YET_OPEN' | 'CLOSED';

export interface IPublicSalonInfo {
    id: string;
    place: string;
    startingDate: string;
    endingDate: string;
    registrationOpen: boolean;
    registrationOpeningDate: string | null;
    registrationClosingDate: string | null;
    closedReason: RegistrationClosedReason | null;
    dimensions: IPublicDimension[];
    prices: IRegistrationPrices;
}

export interface ICaptchaConfig {
    enabled: boolean;
    siteKey: string;
}

export interface IRegistrationExhibitor {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string | null;
    language: string | null;
    homeAddress: IAddress | null;
    differentBillingAddress: boolean;
    billingAddress: IAddress | null;
    newsletter: boolean;
}

export interface IRegistrationParticipation {
    therapistName: string | null;
    nbMeal1: number;
    nbMeal2: number;
    nbMeal3: number;
    modePaymentMeals: ModePaymentMeals | null;
    invoiceSendingMethod: InvoiceSendingMethod;
    hasOffer: boolean;
    offer: string | null;
    additionnalInformation: string | null;
    acceptedChart: boolean;
    acceptedContract: boolean;
}

export interface IRegistrationStand {
    description: string;
    dimensionId: string | null;
    category: Category | null;
    subCategories: string[];
    nbTable: number;
    nbChair: number;
    needElectricity: boolean;
    shared: boolean;
    website: string | null;
    instagram: string | null;
    facebook: string | null;
    urlPicture: string | null;
}

export interface IRegistrationTalk {
    title: string;
    description: string;
}

export interface IRegistrationRequest {
    exhibitor: IRegistrationExhibitor;
    participation: IRegistrationParticipation;
    stands: IRegistrationStand[];
    conferences: IRegistrationTalk[];
    workshops: IRegistrationTalk[];
    captchaToken?: string | null;
}

export interface IRegistrationResponse {
    participationId: string;
    firstName: string;
    email: string;
}
