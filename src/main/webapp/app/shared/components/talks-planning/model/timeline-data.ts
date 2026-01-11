import {TimelineDay} from "./timeline-day";
import {TimelineRoom} from "./timeline-room";

import {IntervalMinutes} from "./interval-minutes";

export interface TimelineData {
    eventId: string;
    intervalMinutes: IntervalMinutes;
    days: TimelineDay[];
    rooms: TimelineRoom[];
}