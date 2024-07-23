import { Component, inject, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ISalon } from 'app/entities/salon/salon.model';
import { SalonService } from 'app/entities/salon/service/salon.service';
import { IConfigurationSalon } from '../configuration-salon.model';
import { ConfigurationSalonService } from '../service/configuration-salon.service';
import { ConfigurationSalonFormService, ConfigurationSalonFormGroup } from './configuration-salon-form.service';

@Component({
  standalone: true,
  selector: 'jhi-configuration-salon-update',
  templateUrl: './configuration-salon-update.component.html',
  imports: [SharedModule, FormsModule, ReactiveFormsModule],
})
export class ConfigurationSalonUpdateComponent implements OnInit {
  isSaving = false;
  configurationSalon: IConfigurationSalon | null = null;

  salonsCollection: ISalon[] = [];

  protected configurationSalonService = inject(ConfigurationSalonService);
  protected configurationSalonFormService = inject(ConfigurationSalonFormService);
  protected salonService = inject(SalonService);
  protected activatedRoute = inject(ActivatedRoute);

  // eslint-disable-next-line @typescript-eslint/member-ordering
  editForm: ConfigurationSalonFormGroup = this.configurationSalonFormService.createConfigurationSalonFormGroup();

  compareSalon = (o1: ISalon | null, o2: ISalon | null): boolean => this.salonService.compareSalon(o1, o2);

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ configurationSalon }) => {
      this.configurationSalon = configurationSalon;
      if (configurationSalon) {
        this.updateForm(configurationSalon);
      }

      this.loadRelationshipsOptions();
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const configurationSalon = this.configurationSalonFormService.getConfigurationSalon(this.editForm);
    if (configurationSalon.id !== null) {
      this.subscribeToSaveResponse(this.configurationSalonService.update(configurationSalon));
    } else {
      this.subscribeToSaveResponse(this.configurationSalonService.create(configurationSalon));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IConfigurationSalon>>): void {
    result.pipe(finalize(() => this.onSaveFinalize())).subscribe({
      next: () => this.onSaveSuccess(),
      error: () => this.onSaveError(),
    });
  }

  protected onSaveSuccess(): void {
    this.previousState();
  }

  protected onSaveError(): void {
    // Api for inheritance.
  }

  protected onSaveFinalize(): void {
    this.isSaving = false;
  }

  protected updateForm(configurationSalon: IConfigurationSalon): void {
    this.configurationSalon = configurationSalon;
    this.configurationSalonFormService.resetForm(this.editForm, configurationSalon);

    this.salonsCollection = this.salonService.addSalonToCollectionIfMissing<ISalon>(this.salonsCollection, configurationSalon.salon);
  }

  protected loadRelationshipsOptions(): void {
    this.salonService
      .query({ filter: 'configuration-is-null' })
      .pipe(map((res: HttpResponse<ISalon[]>) => res.body ?? []))
      .pipe(map((salons: ISalon[]) => this.salonService.addSalonToCollectionIfMissing<ISalon>(salons, this.configurationSalon?.salon)))
      .subscribe((salons: ISalon[]) => (this.salonsCollection = salons));
  }
}
