/**
 * Redimensionnement et validation des images côté navigateur.
 *
 * Ces contraintes doivent rester alignées avec `ch.salon.service.image.ImageConstraints` : le
 * serveur re-valide et ré-encode systématiquement, ce traitement client n'est là que pour le
 * confort d'utilisation et pour éviter d'envoyer des fichiers inutilement lourds.
 */

export const IMAGE_MAX_BYTES = 1024 * 1024;
export const IMAGE_MAX_WIDTH = 500;
export const IMAGE_ACCEPTED_TYPES = ['image/jpeg', 'image/png'];
export const IMAGE_ACCEPT_ATTRIBUTE = 'image/jpeg,image/png';

export type ImageValidationError = 'type' | 'size' | 'unreadable';

export class ImageProcessingError extends Error {
    constructor(public readonly reason: ImageValidationError) {
        super(reason);
    }
}

export interface ProcessedImageUpload {
    filename: string;
    contentType: string;
    dataBase64: string;
    width: number;
    height: number;
    sizeBytes: number;
    /** URL de données locale, utilisable pour l'aperçu immédiat. */
    previewUrl: string;
}

/**
 * Valide un fichier puis le redimensionne à `IMAGE_MAX_WIDTH` de large en conservant le ratio et le
 * format d'origine (JPEG -> JPEG, PNG -> PNG).
 */
export async function resizeImage(file: File): Promise<ProcessedImageUpload> {
    const contentType = normalizeType(file.type);

    if (!IMAGE_ACCEPTED_TYPES.includes(contentType)) {
        throw new ImageProcessingError('type');
    }

    if (file.size > IMAGE_MAX_BYTES) {
        throw new ImageProcessingError('size');
    }

    const bitmap = await decode(file);

    try {
        const targetWidth = Math.min(bitmap.width, IMAGE_MAX_WIDTH);
        const targetHeight = Math.max(1, Math.round(bitmap.height * (targetWidth / bitmap.width)));

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const context = canvas.getContext('2d');
        if (!context) {
            throw new ImageProcessingError('unreadable');
        }

        if (contentType === 'image/jpeg') {
            // Le JPEG ne gère pas la transparence : on aplatit sur un fond blanc.
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, targetWidth, targetHeight);
        }
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

        const dataUrl = canvas.toDataURL(contentType, 0.85);
        const dataBase64 = dataUrl.substring(dataUrl.indexOf(',') + 1);

        return {
            filename: file.name,
            contentType,
            dataBase64,
            width: targetWidth,
            height: targetHeight,
            sizeBytes: Math.round((dataBase64.length * 3) / 4),
            previewUrl: dataUrl
        };
    } finally {
        bitmap.close?.();
    }
}

/**
 * Convertit un blob image en PNG, seul format accepté par le presse-papier des navigateurs.
 */
export async function toPngBlob(blob: Blob): Promise<Blob> {
    if (blob.type === 'image/png') {
        return blob;
    }

    const bitmap = await decode(blob);

    try {
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;

        const context = canvas.getContext('2d');
        if (!context) {
            throw new ImageProcessingError('unreadable');
        }
        context.drawImage(bitmap, 0, 0);

        return await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(result => (result ? resolve(result) : reject(new ImageProcessingError('unreadable'))), 'image/png');
        });
    } finally {
        bitmap.close?.();
    }
}

function normalizeType(type: string | null | undefined): string {
    const normalized = (type ?? '').split(';')[0].trim().toLowerCase();
    return normalized === 'image/jpg' ? 'image/jpeg' : normalized;
}

async function decode(blob: Blob): Promise<ImageBitmap> {
    try {
        return await createImageBitmap(blob);
    } catch {
        throw new ImageProcessingError('unreadable');
    }
}
