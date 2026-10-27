import {IParticipation} from '../../participation/model/participation.interface';
import {Status} from '../../enumerations/status.model';
import {Category} from '../../enumerations/category.model';
import {IPriceStandSalon} from '../../salon/model/price-stand-salon.interface';
import {ProcessedImageUpload} from '../../../shared/utils/image-resize.util';

/**
 * Métadonnées d'une image enregistrée en base (les octets sont servis par un endpoint dédié).
 */
export interface IImageMetadata {
    contentType: string;
    filename: string | null;
    sizeBytes: number;
    width: number;
    height: number;
}

export interface IStand {
    id: string;
    description: string;
    /** L'exposant accepte d'être publié sur le site web du salon. */
    publishedOnWebsite: boolean;
    website: string | null;
    instagram: string | null;
    facebook: string | null;
    /** Ancien lien Google Drive, conservé en lecture seule pour l'historique. */
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
    /** Le co-exposant accepte d'être publié sur le site web du salon. */
    sharedPublishedOnWebsite: boolean;
    sharedWebsite: string | null;
    sharedInstagram: string | null;
    sharedFacebook: string | null;
    /** Ancien lien Google Drive du co-exposant, conservé en lecture seule pour l'historique. */
    sharedUrlPicture: string | null;
    status: Status;
    category: Category | null;
    subCategories: string[] | [];
    extraInformation: string | null;
    registrationDate: string | null;
    participation: IParticipation;
    dimension: IPriceStandSalon;
    picture: IImageMetadata | null;
    sharedPicture: IImageMetadata | null;
    pictureUpload: ProcessedImageUpload | null;
    sharedPictureUpload: ProcessedImageUpload | null;
    removePicture: boolean;
    removeSharedPicture: boolean;
}
