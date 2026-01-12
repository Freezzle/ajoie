import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
          name: 'timeSince',
          standalone: true
      })
export class TimeSincePipe implements PipeTransform {
    transform(value: Date | string | number | null | undefined): string {
        if (value == null) {
            return '';
        }

        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) {
            return '';
        }

        const now = new Date();
        const diffMs = now.getTime() - date.getTime();

        // Si la date est dans le futur, on considère "0 minute"
        const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

        if (diffMinutes <= 59) {
            return `Il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
        }

        if (diffMinutes <= 1439) {
            const hours = Math.floor(diffMinutes / 60);
            return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
        }

        if (diffMinutes <= 43199) {
            const days = Math.floor(diffMinutes / 1440);
            return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
        }

        return 'Il y a longtemps';
    }
}
