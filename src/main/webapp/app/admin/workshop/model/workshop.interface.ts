import {Status} from '../../enumerations/status.model';
import {IParticipation} from '../../participation/model/participation.interface';

export interface IWorkshop {
    id: string;
    title: string;
    description: string;
    status: keyof typeof Status;
    extraInformation: string | null;
    participation: IParticipation;
}
