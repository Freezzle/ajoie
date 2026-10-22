import {Status} from '../../enumerations/status.model';
import {IParticipation} from '../../participation/model/participation.interface';

export interface IWorkshop {
    id: string;
    title: string;
    description: string;
    status: Status;
    extraInformation: string | null;
    registrationDate: string | null;
    participation: IParticipation;
}
