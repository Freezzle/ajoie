import {inject, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';
import {ApplicationConfigService} from '../../../core/config/application-config.service';
import {IFloorPlanSettings, normalizeFloorPlanSettings} from '../floor-plan.model';

/** Réglages du plan de la salle : il y en a un seul par salon. */
@Injectable({providedIn: 'root'})
export class FloorPlanSettingsService {
    private readonly http = inject(HttpClient);
    private readonly applicationConfigService = inject(ApplicationConfigService);
    private readonly resourceUrl = this.applicationConfigService.getEndpointFor('api/admin/salons');

    load(idSalon: string): Observable<IFloorPlanSettings> {
        return this.http.get<Partial<IFloorPlanSettings>>(`${this.resourceUrl}/${idSalon}/floor-plan-settings`)
                   .pipe(map(settings => normalizeFloorPlanSettings(settings)));
    }

    save(idSalon: string, settings: IFloorPlanSettings): Observable<IFloorPlanSettings> {
        return this.http.put<Partial<IFloorPlanSettings>>(
            `${this.resourceUrl}/${idSalon}/floor-plan-settings`, settings
        ).pipe(map(saved => normalizeFloorPlanSettings(saved)));
    }
}
