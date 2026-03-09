import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

import {ApplicationConfigService} from 'app/core/config/application-config.service';

@Injectable({providedIn: 'root'})
export class VolunteerPlanningService {
    protected http = inject(HttpClient);
    protected applicationConfigService = inject(ApplicationConfigService);
    protected resourceUrl = this.applicationConfigService.getEndpointFor('api/admin/salons');

    getPlanningVolunteers(idSalon: string): Observable<PlanningVolunteersDto> {
        return this.http.get<PlanningVolunteersDto>(`${this.resourceUrl}/${idSalon}/planning-volunteers`);
    }

    savePlanningVolunteers(idSalon: string, payload: PlanningVolunteersDto): Observable<void> {
        return this.http.put<void>(`${this.resourceUrl}/${idSalon}/planning-volunteers`, payload);
    }
}

export interface VolunteerPlanningDto {
    id: string;
    label: string;
}

export interface CategoryDto {
    id: string;
    label: string;
    icon: string;
    color: string;
}

export interface VolunteerPlanningCellDto {
    volunteerId: string;
    slotIndex: number;
    categoryId: string;
}

export interface VolunteerPlanningDayDto {
    id: string;
    label: string;
    startTime: string;
    endTime: string;
    intervalMinutes?: number;
    assignedVolunteerIds: string[];
    cells: VolunteerPlanningCellDto[];
}

export interface VolunteerPlanningConfigurationDto {
    intervalMinutes?: number;
    categories: CategoryDto[];
    days: VolunteerPlanningDayDto[];
}

export interface PlanningVolunteersDto {
    id?: string;
    configuration: VolunteerPlanningConfigurationDto;
    volunteers: VolunteerPlanningDto[];
}
