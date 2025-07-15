import {IParticipation} from '../../participation/model/participation.interface';
import {Status} from '../../enumerations/status.model';
import {Category} from '../../enumerations/category.model';
import {IPriceStandSalon} from "../../salon/model/price-stand-salon.interface";

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
    status: keyof typeof Status;
    category: keyof typeof Category | null;
    extraInformation: string | null;
    participation: IParticipation;
    dimension: IPriceStandSalon;
}
