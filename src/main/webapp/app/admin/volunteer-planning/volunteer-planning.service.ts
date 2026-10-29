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

    savePlanningVolunteers(idSalon: string, payload: PlanningVolunteersDto): Observable<PlanningVolunteersDto> {
        return this.http.put<PlanningVolunteersDto>(`${this.resourceUrl}/${idSalon}/planning-volunteers`, payload);
    }
}

export interface VolunteerPlanningDto {
    id: string;
    label: string;
}

export interface CategoryDto {
    id: string;
    label: string;
    icon?: string;
    color: string;
    description?: string;
}

export interface VolunteerPlanningCellDto {
    volunteerId: string;
    slotIndex: number;
    categoryId: string;
}

export interface VolunteerPlanningNeedDto {
    categoryId: string;
    slotIndex: number;
    min: number;
}

export interface VolunteerPlanningDayDto {
    id: string;
    label: string;
    date?: string;
    description?: string;
    startTime: string;
    endTime: string;
    intervalMinutes?: number;
    assignedVolunteerIds: string[];
    cells: VolunteerPlanningCellDto[];
    unavailableCells?: { volunteerId: string; slotIndex: number }[];
    needs?: VolunteerPlanningNeedDto[];
}

export interface VolunteerPlanningConfigurationDto {
    intervalMinutes?: number;
    categories: CategoryDto[];
    days: VolunteerPlanningDayDto[];
}

export interface PlanningVolunteersDto {
    id?: string;
    version?: number;
    configuration: VolunteerPlanningConfigurationDto;
    volunteers: VolunteerPlanningDto[];
}
