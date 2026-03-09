export type IntervalMinutes = 5 | 15 | 30 | 60;

export type Volunteer = { id: string; label: string };

export type Category = {
    id: string;         // non visible
    label: string;
    icon: string;       // ex: "pi pi-shop"
    color: string;      // ex: "#FFDDC1"
};

export type DayCell = {
    volunteerId: string;
    slotIndex: number;
    categoryId: string; // référence vers Category.id
};

export type Day = {
    id: string;         // non visible
    label: string;
    startTime: Date;    // time-only
    endTime: Date;      // time-only
    intervalMinutes: IntervalMinutes;
    assignedVolunteerIds: string[];
    cells: DayCell[];
};

export type Planning = {
    volunteers: Volunteer[];
    days: Day[];
    categories: Category[];
};

export type Tool =
    | { kind: 'CATEGORY'; categoryId: string }
    | { kind: 'ERASER' } | {kind: 'NONE'};

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

export type TimeSlot = { index: number; label: string };

export function computeTimeSlots(startTime: Date, endTime: Date, interval: IntervalMinutes): TimeSlot[] {
    const s = normalizeTime(startTime);
    const e = normalizeTime(endTime);
    if (e.getTime() <= s.getTime()) {
        return [];
    }

    const diffMin = Math.floor((e.getTime() - s.getTime()) / 60000);
    const steps = Math.floor(diffMin / interval);

    const slots: TimeSlot[] = [];
    for (let i = 0; i < steps; i++) {
        const t = new Date(s.getTime() + i * interval * 60000);
        slots.push({index: i, label: hhmm(t)});
    }
    return slots;
}