import {Component, EventEmitter, Input, Optional, Output, Self, ViewChild} from '@angular/core';
import {ControlValueAccessor, FormControl, NgControl, Validators} from '@angular/forms';
import {FileUpload, FileUploadHandlerEvent} from 'primeng/fileupload';
import SharedModule from '../../shared.module';
import {ErrorBoxComponent} from '../../error-box/error-box.component';
import {
    IMAGE_ACCEPT_ATTRIBUTE,
    IMAGE_MAX_BYTES,
    IMAGE_MAX_WIDTH,
    ImageProcessingError,
    ProcessedImageUpload,
    resizeImage
} from '../../utils/image-resize.util';

/**
 * Champ d'upload d'image réutilisable (glisser-déposer PrimeNG).
 *
 * L'image est validée et redimensionnée dans le navigateur avant d'être transmise sous forme de
 * base64 ; le serveur refait l'intégralité des contrôles.
 */
@Component({
               imports: [SharedModule, FileUpload, ErrorBoxComponent],
               selector: 'image-upload-box',
               templateUrl: './image-upload-box.component.html',
               styleUrls: ['./image-upload-box.component.scss']
           })
export class ImageUploadBoxComponent implements ControlValueAccessor {
    @Input()
    translateKey: string | undefined;
    @Input()
    fieldName: string = '';
    /** URL de l'image déjà enregistrée (aperçu côté administration). */
    @Input()
    existingPictureUrl: string | null = null;
    /** Indique qu'une image existe déjà sans en exposer l'aperçu (inscription publique). */
    @Input()
    hasExistingPicture: boolean = false;
    /** Affiche l'astérisque « champ obligatoire » (la validation reste portée par le formulaire). */
    @Input()
    required: boolean = false;

    /** Émis lorsque l'utilisateur supprime l'image déjà enregistrée. */
    @Output()
    existingRemoved = new EventEmitter<void>();

    @ViewChild('uploader')
    uploader: FileUpload | undefined;

    value: ProcessedImageUpload | null = null;
    disabled = false;
    errorKey: string | null = null;
    existingRemovedFlag = false;

    protected readonly acceptAttribute = IMAGE_ACCEPT_ATTRIBUTE;
    protected readonly maxBytes = IMAGE_MAX_BYTES;
    protected readonly maxWidth = IMAGE_MAX_WIDTH;

    constructor(@Self() @Optional() public controlDir: NgControl | null) {
        if (this.controlDir) {
            this.controlDir.valueAccessor = this;
        }
    }

    get control(): FormControl | null {
        return (this.controlDir?.control as FormControl | null) ?? null;
    }

    get isRequired(): boolean {
        return this.required || (this.control?.hasValidator(Validators.required) ?? false);
    }

    get showsExisting(): boolean {
        return (this.hasExistingPicture || !!this.existingPictureUrl) && !this.existingRemovedFlag;
    }

    get hasPicture(): boolean {
        return this.value !== null || this.showsExisting;
    }

    onChange: (value: ProcessedImageUpload | null) => void = () => {
    };

    onTouched: () => void = () => {
    };

    writeValue(value: ProcessedImageUpload | null): void {
        this.value = value ?? null;
    }

    registerOnChange(fn: (value: ProcessedImageUpload | null) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    async select(event: FileUploadHandlerEvent): Promise<void> {
        const file = event.files?.[0];
        this.uploader?.clear();

        if (!file) {
            return;
        }

        this.errorKey = null;

        try {
            this.value = await resizeImage(file);
            this.existingRemovedFlag = false;
            this.onChange(this.value);
            this.onTouched();
        } catch (error) {
            this.value = null;
            this.onChange(null);
            this.errorKey = error instanceof ImageProcessingError
                            ? `global.image.error.${error.reason}`
                            : 'global.image.error.unreadable';
        }
    }

    remove(): void {
        this.errorKey = null;

        if (this.value) {
            this.value = null;
            this.onChange(null);
            this.onTouched();
            return;
        }

        if (this.showsExisting) {
            this.existingRemovedFlag = true;
            this.existingRemoved.emit();
            this.onTouched();
            // L'image existante comptait pour la validation « champ obligatoire ».
            this.control?.updateValueAndValidity();
        }
    }
}
