import {Pipe, PipeTransform} from '@angular/core';
import dayjs from 'dayjs/esm';

/**
 * Transforme une date en texte relatif lisible, passé ET futur.
 *
 * Exemples :
 *   -90  → "Il y a 3 mois"
 *   -14  → "Il y a 14 jours"
 *   -1   → "Hier"
 *    0   → "Aujourd'hui"
 *   +1   → "Demain"
 *   +3   → "Dans 3 jours"
 *   +14  → "Dans 2 semaines"
 *   +60  → "Dans 2 mois"
 */
@Pipe({
    standalone: true,
    name: 'daysRelative'
})
export default class DaysRelativePipe implements PipeTransform {
    transform(dueDate: string | Date | dayjs.Dayjs | null | undefined): string {
        if (!dueDate) return '';

        const today = dayjs().startOf('day');
        const due = (dayjs.isDayjs(dueDate) ? dueDate : dayjs(dueDate as string | Date)).startOf('day');
        const diff = due.diff(today, 'day');

        if (diff === 0)  return "Aujourd'hui";
        if (diff === 1)  return 'Demain';
        if (diff === -1) return 'Hier';

        if (diff > 0) {
            if (diff < 7)  return `Dans ${diff} jours`;
            if (diff < 14) return 'Dans 1 semaine';
            if (diff < 30) return `Dans ${Math.round(diff / 7)} semaines`;
            if (diff < 60) return 'Dans 1 mois';
            return `Dans ${Math.round(diff / 30)} mois`;
        }

        // Passé
        const abs = Math.abs(diff);
        if (abs < 7)  return `Il y a ${abs} jours`;
        if (abs < 14) return 'Il y a 1 semaine';
        if (abs < 30) return `Il y a ${Math.round(abs / 7)} semaines`;
        if (abs < 60) return 'Il y a 1 mois';
        return `Il y a ${Math.round(abs / 30)} mois`;
    }
}
