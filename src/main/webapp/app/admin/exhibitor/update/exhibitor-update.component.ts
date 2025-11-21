import {Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {Observable, of} from 'rxjs';
import {finalize} from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ExhibitorService} from '../service/exhibitor.service';
import {ExhibitorFormGroup, ExhibitorFormService} from '../service/exhibitor-form.service';
import {formatterLanguage, LANGUAGES} from '../../../config/language.constants';
import ColorStatusPipe from '../../../shared/pipe/color-status.pipe';
import StatusPipe from '../../../shared/pipe/status.pipe';
import {IParticipation} from '../../participation/model/participation.interface';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {TextBoxComponent} from '../../../shared/components/text-box/text-box.component';
import {TextareaBoxComponent} from '../../../shared/components/textarea-box/textarea-box.component';
import {SelectBoxComponent} from '../../../shared/components/select-box/select-box.component';
import {IExhibitor} from '../model/exhibitor.interface';
import {CheckboxBoxComponent} from "../../../shared/components/checkbox-box/checkbox-box.component";
import {AlertErrorComponent} from "../../../shared/alert/alert-error.component";
import {AlertComponent} from "../../../shared/alert/alert.component";
import {TableModule} from "primeng/table";
import {ConfirmPopup} from "primeng/confirmpopup";
import {Toast} from "primeng/toast";
import {CountryService, formatterCountry} from "../../../shared/country.service";
import {CardComponent} from "../../../shared/components/card/card.component";
import {ContentPageComponent} from "../../../shared/components/content-page/content-page.component";

@Component({
    selector: 'app-exhibitor-update',
    templateUrl: './exhibitor-update.component.html',
    imports: [
        SharedModule,
        FormsModule,
        ReactiveFormsModule,
        ColorStatusPipe,
        StatusPipe,
        RouterLink,
        ButtonBoxComponent,
        TextBoxComponent,
        TextareaBoxComponent,
        SelectBoxComponent,
        CheckboxBoxComponent,
        AlertErrorComponent,
        AlertComponent,
        TableModule,
        ConfirmPopup,
        Toast,
        CardComponent,
        ContentPageComponent,
    ]
})
export class ExhibitorUpdateComponent implements OnInit {
    protected exhibitorService = inject(ExhibitorService);
    protected countryService = inject(CountryService);
    protected exhibitorFormService = inject(ExhibitorFormService);
    protected activatedRoute = inject(ActivatedRoute);

    isLoading = false;
    isReadOnly = false;

    initialExhibitor: IExhibitor | null = null;
    editForm: ExhibitorFormGroup = this.exhibitorFormService.createExhibitorFormGroup(null);

    languageValues = LANGUAGES;
    participations$: Observable<IParticipation[]> = of([]);

    ngOnInit(): void {
        const data = this.activatedRoute.snapshot.data;

        this.initialExhibitor = {...data['exhibitor']};
        this.editForm = this.exhibitorFormService.createExhibitorFormGroup(this.initialExhibitor);

        if (data['readonly']) {
            this.isReadOnly = true;
            this.editForm.disable();
        } else {
            this.edit();
        }

        this.loadRelationships(this.editForm.controls.id.value);
    }

    edit(): void {
        this.isReadOnly = false;
        this.editForm.enable();
    }

    previousState(): void {
        window.history.back();
    }

    cancel(): void {
        this.isReadOnly = true;
        this.editForm = this.exhibitorFormService.createExhibitorFormGroup(this.initialExhibitor);
        this.editForm.disable();
    }

    save(): void {
        if (this.editForm.invalid) {
            this.editForm.markAllAsTouched();
            return;
        }
        this.isLoading = true;
        const exhibitor = this.exhibitorFormService.getExhibitor(this.editForm);

        const saveOperation = exhibitor.id != null
            ? this.exhibitorService.update(exhibitor)
            : this.exhibitorService.create(exhibitor);

        saveOperation.pipe(finalize(() => (this.isLoading = false))).subscribe(() => this.previousState());
    }

    loadRelationships(idExhibitor: string | null): void {
        if (!idExhibitor) {
            return;
        }
        this.participations$ = this.exhibitorService.findParticipations(idExhibitor);
    }

    protected readonly formatterLanguage = formatterLanguage;
    protected readonly formatterCountry = formatterCountry;
}
