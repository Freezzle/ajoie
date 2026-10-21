import {inject, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';
import {ApplicationConfigService} from '../../../core/config/application-config.service';
import {IFloorElement, IFloorLocation, IFloorPlan} from '../floor-plan.model';

/** Contenu de la colonne `data` d'un plan, tel qu'il circule avec le serveur. */
interface IFloorPlanData {
    widthMeter: number;
    heightMeter: number;
    locations: IFloorLocation[];
    elements: IFloorElement[];
}

interface IFloorPlanPayload {
    id: string | null;
    position: number;
    name: string;
    data: string;
}

@Injectable({providedIn: 'root'})
export class FloorPlanService {
    private readonly http = inject(HttpClient);
    private readonly applicationConfigService = inject(ApplicationConfigService);
    private readonly resourceUrl = this.applicationConfigService.getEndpointFor('api/admin/salons');

    load(idSalon: string): Observable<IFloorPlan[]> {
        return this.http.get<IFloorPlanPayload[]>(`${this.resourceUrl}/${idSalon}/floor-plan`)
                   .pipe(map(plans => plans.map(plan => fromPayload(plan))));
    }

    batchSave(idSalon: string, floorPlans: IFloorPlan[], idsToDelete: string[]): Observable<IFloorPlan[]> {
        const payload = {
            floorPlans: floorPlans.map(plan => toPayload(plan)),
            idsToDelete
        };

        return this.http.put<{ floorPlans: IFloorPlanPayload[] }>(
            `${this.resourceUrl}/${idSalon}/floor-plans`, payload
        ).pipe(map(response => response.floorPlans.map(plan => fromPayload(plan))));
    }
}

function fromPayload(payload: IFloorPlanPayload): IFloorPlan {
    const data = parseData(payload.data);
    return {
        id: payload.id,
        position: payload.position,
        name: payload.name,
        widthMeter: data.widthMeter ?? 20,
        heightMeter: data.heightMeter ?? 10,
        locations: (data.locations ?? []).map(location => ({
            ...location,
            rotationDeg: location.rotationDeg ?? 0
        })),
        elements: (data.elements ?? []).map(element => ({
            ...element,
            rotationDeg: element.rotationDeg ?? 0,
            blockingOverride: element.blockingOverride ?? null
        }))
    };
}

function toPayload(plan: IFloorPlan): IFloorPlanPayload {
    const data: IFloorPlanData = {
        widthMeter: plan.widthMeter,
        heightMeter: plan.heightMeter,
        locations: plan.locations,
        elements: plan.elements
    };

    return {
        id: plan.id,
        position: plan.position,
        name: plan.name,
        data: JSON.stringify(data)
    };
}

function parseData(raw: string | null): Partial<IFloorPlanData> {
    if (!raw) {
        return {};
    }
    try {
        return JSON.parse(raw) as Partial<IFloorPlanData>;
    } catch {
        return {};
    }
}
