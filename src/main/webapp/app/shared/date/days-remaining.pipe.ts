import {Pipe, PipeTransform} from '@angular/core';
import dayjs from 'dayjs/esm';

/**
 * Transforme une date d'échéance en label de jours relatifs au jour courant.
 *
 * Exemples :
 *   J-14   → 14 jours avant la date
 *   J-1    → demain (dans 1 jour)  — NON : avant-hier
 *   Aujourd'hui → même jour
 *   J+3    → 3 jours après
 *
 * Retourne '' si la date est null, ou si le status est DONE / CANCELLED.
 */
@Pipe({
    standalone: true,
    name: 'daysRemaining'
})
export default class DaysRemainingPipe implements PipeTransform {
    transform(
        dueDate: string | Date | dayjs.Dayjs | null | undefined,
        status?: string | null
    ): string {
        if (!dueDate) return '';
        if (status === 'DONE' || status === 'CANCELLED') return '';

        const today = dayjs().startOf('day');
        const due = (dayjs.isDayjs(dueDate) ? dueDate : dayjs(dueDate as string | Date)).startOf('day');
        const diff = due.diff(today, 'day');

        if (diff === 0) return "Aujourd'hui";
        if (diff > 0) return `J+${diff}`;
        return `J${diff}`; // diff négatif → ex: J-14
    }
}
