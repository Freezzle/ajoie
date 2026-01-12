import {TimelineRoomData} from './timeline-room-data';

export interface TimelineDay {
    id: string;
    label: string;
    rooms: TimelineRoomData[];
}