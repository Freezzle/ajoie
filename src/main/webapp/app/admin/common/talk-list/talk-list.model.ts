import {Status} from '../../enumerations/status.model';
import {IParticipation} from '../../participation/model/participation.interface';

/**
 * Conférences et ateliers partagent le même modèle : un seul rendu de liste
 * suffit pour les deux écrans.
 */
export interface ITalk {
    id: string;
    title: string;
    description: string;
    status: Status;
    extraInformation: string | null;
    registrationDate: string | null;
    participation: IParticipation;
}
