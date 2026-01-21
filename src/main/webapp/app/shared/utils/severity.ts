import {ButtonSeverity} from 'primeng/button';

export type SEVERITY = 'primary' | 'secondary' | 'warning' | 'danger' | 'success';

export function convertSeverity(type: SEVERITY = 'primary'): ButtonSeverity {
    if (type === 'primary') {
        return 'primary';
    } else if (type === 'secondary') {
        return 'secondary';
    } else if (type === 'warning') {
        return 'warn';
    } else if (type === 'danger') {
        return 'danger';
    } else if (type === 'success') {
        return 'success';
    } else {
        return 'primary';
    }
}