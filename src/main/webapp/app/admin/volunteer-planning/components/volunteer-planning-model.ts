export type IntervalMinutes = 5 | 15 | 30 | 60;

export type Volunteer = { id: string; label: string };

export type Category = {
    id: string;         // non visible
    label: string;
    icon?: string;      // ex: "pi pi-shop" — optionnel
    color: string;      // ex: "#FFDDC1"
};

export type DayCell = {
    volunteerId: string;
    slotIndex: number;
    categoryId: string; // référence vers Category.id
};

export type UnavailableCell = {
    volunteerId: string;
    slotIndex: number;
};

export type Day = {
    id: string;         // non visible
    label: string;
    startTime: Date;    // time-only
    endTime: Date;      // time-only
    intervalMinutes: IntervalMinutes;
    assignedVolunteerIds: string[];
    cells: DayCell[];
    unavailableCells: UnavailableCell[];
};

export type Planning = {
    volunteers: Volunteer[];
    days: Day[];
    categories: Category[];
};

export type Tool =
    | { kind: 'CATEGORY'; categoryId: string }
    | { kind: 'ERASER' }
    | { kind: 'UNAVAILABLE' }
    | { kind: 'CLEAR_UNAVAILABLE' }
    | { kind: 'NONE' };

// ---------- helpers ----------
export function newId(prefix: 'd' | 'v' | 'c'): string {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

export function normalizeTime(d: Date): Date {
    const x = new Date(d);
    x.setSeconds(0, 0);
    return x;
}

export function hhmm(d: Date): string {
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
}

export function normalizeHex(v: string): string | null {
    if (!v) {
        return null;
    }
    const s = v.startsWith('#') ? v : `#${v}`;
    return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s) ? s : null;
}

export type TimeSlot = { index: number; label: string; displayLabel: string };

export function computeTimeSlots(startTime: Date, endTime: Date, interval: IntervalMinutes): TimeSlot[] {
    const s = normalizeTime(startTime);
    const e = normalizeTime(endTime);
    if (e.getTime() <= s.getTime()) {
        return [];
    }

    const diffMin = Math.floor((e.getTime() - s.getTime()) / 60000);
    const steps = Math.floor(diffMin / interval);

    const slots: TimeSlot[] = [];
    // counter : slots écoulés depuis la 1ère heure pleine rencontrée.
    // Afficher quand counter est pair (0, 2, 4…) → 1 sur 2 à partir de :00.
    // Avant la 1ère heure pleine : pas affiché (sauf le tout 1er slot).
    let counter: number | null = null;
    for (let i = 0; i < steps; i++) {
        const t = new Date(s.getTime() + i * interval * 60000);
        const label = hhmm(t);

        if (t.getMinutes() === 0) {
            counter = 0;
        } else if (counter !== null) {
            counter++;
        }

        const show = i === 0 || (counter !== null && counter % 2 === 0);
        slots.push({index: i, label, displayLabel: show ? label : ''});
    }
    return slots;
}