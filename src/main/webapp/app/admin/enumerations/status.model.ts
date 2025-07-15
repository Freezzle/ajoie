export enum Status {
    REFUSED = 'REFUSED',
    CANCELED = 'CANCELED',
    IN_VERIFICATION = 'IN_VERIFICATION',
    ACCEPTED = 'ACCEPTED',
    VALIDATED = 'VALIDATED',
    CLOSED = 'CLOSED'
}

export function formatterStatus(status: Status | null): string {
    return 'stand.status.list.' + status;
}

export function compareStatus(o1: Status, o2: Status): boolean {
    return o1 === o2;
}
