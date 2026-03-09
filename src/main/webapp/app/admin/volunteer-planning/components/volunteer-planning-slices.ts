import {Day, Volunteer} from './volunteer-planning-model';

export type DayConfigSlice = {
    day: Day; // le jour sélectionné (objet complet, intervalMinutes inclus)
};

export type AssignmentsSlice = {
    dayId: string;
    volunteers: Volunteer[];
    assignedVolunteerIds: string[];
    // optionnel si tu veux afficher le nom du jour dans le dialog
    dayLabel?: string;
};