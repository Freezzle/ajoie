import {IParticipation} from '../../participation/model/participation.interface';
import {Status} from '../../enumerations/status.model';
import {Category} from '../../enumerations/category.model';
import {IPriceStandSalon} from '../../salon/model/price-stand-salon.interface';

export interface IStand {
    id: string;
    description: string;
    website: string | null;
    instagram: string | null;
    facebook: string | null;
    urlPicture: string | null;
    shared: boolean;
    nbTable: number;
    nbChair: number;
    needElectricity: boolean;
    sharedFirstName: string | null;
    sharedLastName: string | null;
    sharedTherapistName: string | null;
    sharedEmail: string | null;
    sharedDescription: string | null;
    sharedCategory: Category | null;
    sharedSubCategories: string[] | [];
    sharedWebsite: string | null;
    sharedInstagram: string | null;
    sharedFacebook: string | null;
    sharedUrlPicture: string | null;
    status: Status;
    category: Category | null;
    subCategories: string[] | [];
    extraInformation: string | null;
    registrationDate: string | null;
    participation: IParticipation;
    dimension: IPriceStandSalon;
}
