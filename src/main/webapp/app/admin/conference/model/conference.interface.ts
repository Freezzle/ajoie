import {Status} from '../../enumerations/status.model';
import {IParticipation} from '../../participation/model/participation.interface';

export interface IConference {
    id: string;
    title: string;
    description: string;
    status: Status;
    extraInformation: string | null;
    participation: IParticipation;
}
