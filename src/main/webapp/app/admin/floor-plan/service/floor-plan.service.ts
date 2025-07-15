import {inject, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {IFloorPlanDataLight, IFloorPlanLight} from '../floor-plan.model';
import {HttpClient} from '@angular/common/http';
import {ApplicationConfigService} from '../../../core/config/application-config.service';
import {map} from 'rxjs/operators';

@Injectable({providedIn: 'root'})
export class FloorPlanService {
    protected http = inject(HttpClient);
    protected applicationConfigService = inject(ApplicationConfigService);
    protected resourceUrl = this.applicationConfigService.getEndpointFor('api/admin/salons');

    create(idSalon: string, floorPlan: IFloorPlanLight): Observable<IFloorPlanLight> {
        return this.http.post<IFloorPlanLight>(`${this.resourceUrl}/${idSalon}/floor-plan`,
            this.mapFloorPlanToBackend(floorPlan));
    }

    save(idSalon: string, idFloorPlan: string, floorPlan: IFloorPlanLight): Observable<IFloorPlanLight> {
        return this.http.put<IFloorPlanLight>(
            `${this.resourceUrl}/${idSalon}/floor-plan/${idFloorPlan}`, this.mapFloorPlanToBackend(floorPlan));
    }

    delete(idSalon: string, idFloorPlan: string): Observable<void> {
        return this.http.delete<void>(`${this.resourceUrl}/${idSalon}/floor-plan/${idFloorPlan}`);
    }

    load(idSalon: string): Observable<IFloorPlanLight[]> {
        return this.http.get<IFloorPlanLight[]>(`${this.resourceUrl}/${idSalon}/floor-plan`)
            .pipe(map(floors => floors.map(this.mapFloorPlanFromBackend)));
    }

    private mapFloorPlanFromBackend(result: {
        id: string | null,
        position: number,
        name: string,
        data: any
    }): IFloorPlanLight {
        return {
            id: result.id,
            position: result.position,
            name: result.name,
            data: JSON.parse(result.data) as IFloorPlanDataLight,
        };
    }

    private mapFloorPlanToBackend(result: IFloorPlanLight): {
        id: string | null,
        position: number,
        name: string,
        data: any
    } {
        return {
            id: result.id,
            position: result.position,
            name: result.name,
            data: JSON.stringify(result.data),
        };
    }
}
