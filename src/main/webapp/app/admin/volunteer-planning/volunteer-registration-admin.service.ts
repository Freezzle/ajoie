import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

import {ApplicationConfigService} from 'app/core/config/application-config.service';

export interface AdminVolunteerRegistrationTimeRange {
    start: string;
    end: string;
}

export interface AdminVolunteerRegistrationAvailabilityDay {
    dayId: string;
    available: boolean;
    ranges: AdminVolunteerRegistrationTimeRange[];
}

export interface AdminVolunteerRegistration {
    id: string;
    planningVolunteerId: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    zoneMode: 'ANY' | 'CHOOSE';
    categoryIds: string[];
    notes?: string;
    availability: AdminVolunteerRegistrationAvailabilityDay[];
    status: 'ACTIVE' | 'CANCELLED' | 'REMOVED';
    registrationDate?: string;
}

/**
 * Accès admin aux inscriptions bénévoles en ligne, pour la popin du planning.
 */
@Injectable({providedIn: 'root'})
export class VolunteerRegistrationAdminService {
    private readonly http = inject(HttpClient);
    private readonly applicationConfigService = inject(ApplicationConfigService);
    private readonly resourceUrl = this.applicationConfigService.getEndpointFor('api/admin/salons');

    getActivePlanningVolunteerIds(salonId: string): Observable<string[]> {
        return this.http.get<string[]>(`${this.resourceUrl}/${salonId}/volunteer-registrations/planning-ids`);
    }

    getByPlanningVolunteerId(salonId: string, planningVolunteerId: string): Observable<AdminVolunteerRegistration> {
        return this.http.get<AdminVolunteerRegistration>(
            `${this.resourceUrl}/${salonId}/volunteer-registrations/by-planning/${planningVolunteerId}`);
    }

    resendLink(salonId: string, registrationId: string): Observable<void> {
        return this.http.post<void>(
            `${this.resourceUrl}/${salonId}/volunteer-registrations/${registrationId}/resend-link`, {});
    }

    remove(salonId: string, registrationId: string): Observable<void> {
        return this.http.post<void>(
            `${this.resourceUrl}/${salonId}/volunteer-registrations/${registrationId}/remove`, {});
    }
}
