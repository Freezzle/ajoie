export type VolunteerClosedReason = 'DISABLED' | 'NOT_YET_OPEN' | 'CLOSED' | null;
export type VolunteerZoneMode = 'ANY' | 'CHOOSE';
export type VolunteerStatus = 'ACTIVE' | 'CANCELLED' | 'REMOVED';

export interface ITimeRange {
    start: string; // "HH:mm"
    end: string;
}

export interface IPublicVolunteerDay {
    id: string;
    label: string;
    date: string | null;
    description: string | null;
    startTime: string; // "HH:mm"
    endTime: string;
}

export interface IPublicVolunteerZone {
    id: string;
    label: string;
    color: string;
    icon: string | null;
    description: string | null;
    dayIds: string[];
}

export interface IPublicVolunteerSalonInfo {
    id: string;
    place: string;
    startingDate: string;
    endingDate: string;
    registrationOpen: boolean;
    closedReason: VolunteerClosedReason;
    registrationClosingDate: string | null;
    welcomeTitle: string | null;
    welcomeText: string | null;
    days: IPublicVolunteerDay[];
    zones: IPublicVolunteerZone[];
}

export interface IVolunteerAvailabilityDay {
    dayId: string;
    available: boolean;
    ranges: ITimeRange[];
}

export interface IVolunteerRegistrationRequest {
    contact: {
        firstName: string;
        lastName: string;
        email: string;
        phoneNumber: string | null;
    };
    availability: IVolunteerAvailabilityDay[];
    preferences: {
        zoneMode: VolunteerZoneMode;
        categoryIds: string[];
        notes: string | null;
    };
    acceptContact: boolean;
    captchaToken?: string | null;
}

export interface IVolunteerRegistration extends IVolunteerRegistrationRequest {
    status: VolunteerStatus;
    editable: boolean;
    registrationClosingDate: string | null;
}

export interface IVolunteerRegistrationResponse {
    registrationId: string;
    firstName: string;
    email: string;
}

export interface IVolunteerCaptchaConfig {
    enabled: boolean;
    siteKey: string;
}
