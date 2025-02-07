import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { IFloorPlan } from '../floor-plan.model';
import { HttpClient } from '@angular/common/http';
import { ApplicationConfigService } from '../../../core/config/application-config.service';

@Injectable({ providedIn: 'root' })
export class FloorPlanService {
  protected http = inject(HttpClient);
  protected applicationConfigService = inject(ApplicationConfigService);
  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/salons');

  create(idSalon: string, floorPlanJson: string): Observable<IFloorPlan> {
    return this.http.post<{ id: string, data: any }>(`${this.resourceUrl}/${idSalon}/floor-plan`,
        { id: null, data: floorPlanJson })
      .pipe(map(result => this.mapFloorPlanFromBackend(result)));
  }

  save(idSalon: string, idFloorPlan: string, floorPlanJson: string): Observable<IFloorPlan> {
    return this.http.put<{ id: string, data: any }>(`${this.resourceUrl}/${idSalon}/floor-plan/${idFloorPlan}`,
      { id: idFloorPlan, data: floorPlanJson }).pipe(map(result => this.mapFloorPlanFromBackend(result)));
  }

  delete(idSalon: string, idFloorPlan: string): Observable<IFloorPlan> {
    return this.http.delete<IFloorPlan>(`${this.resourceUrl}/${idSalon}/floor-plan/${idFloorPlan}`);
  }

  load(idSalon: string): Observable<IFloorPlan[]> {
    return this.http.get<{ id: string, data: any }[]>(`${this.resourceUrl}/${idSalon}/floor-plan`)
      .pipe(map(results => results.map(result => this.mapFloorPlanFromBackend(result))));
  }

  private mapFloorPlanFromBackend(result: { id: string, data: any }): IFloorPlan {
    const floorPlan = JSON.parse(result.data) as IFloorPlan;
    floorPlan.id = result.id ?? null;
    floorPlan.name = floorPlan.name ?? 'default';
    return floorPlan;
  }
}
