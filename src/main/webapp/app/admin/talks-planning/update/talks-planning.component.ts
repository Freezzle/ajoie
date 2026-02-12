import {ActivatedRoute, RouterModule} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {Component, inject, model, OnInit, signal} from '@angular/core';

import SharedModule from 'app/shared/shared.module';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {AlertErrorComponent} from '../../../shared/alert/alert-error.component';


import {ConfirmPopup} from 'primeng/confirmpopup';

import {ConferenceService} from '../../conference/service/conference.service';
import {forkJoin, map, switchMap, tap} from 'rxjs';
import {Talk} from '../../../shared/components/talk-slot/talk-slot.component';
import {CardComponent} from '../../../shared/components/card/card.component';
import {ContentPageComponent} from '../../../shared/components/content-page/content-page.component';
import {WorkshopService} from '../../workshop/service/workshop.service';
import {IWorkshop} from '../../workshop/model/workshop.interface';
import {IConference} from '../../conference/model/conference.interface';
import {Status} from '../../enumerations/status.model';
import {finalize} from 'rxjs/operators';
import {SalonService} from '../../salon/service/salon.service';
import {TimelineDay} from '../../../shared/components/talks-planning/model/timeline-day';
import {TimelineRoom} from '../../../shared/components/talks-planning/model/timeline-room';
import {TimelineData} from '../../../shared/components/talks-planning/model/timeline-data';
import {IntervalMinutes} from '../../../shared/components/talks-planning/model/interval-minutes';
import {TpComponent} from '../../../shared/components/talks-planning/tp.component';
import {getExhibitorFullName} from '../../exhibitor/model/exhibitor.interface';

@Component({
               selector: 'talks-planning',
               templateUrl: './talks-planning.component.html',
               imports: [
                   RouterModule,
                   FormsModule,
                   SharedModule,
                   ButtonBoxComponent,
                   AlertErrorComponent,


                   ConfirmPopup,
                   TpComponent,
                   CardComponent,
                   ContentPageComponent,
                   TpComponent
               ]
           })
export class TalksPlanningComponent implements OnInit {
    readonly isLoading = signal<boolean>(false);
    readonly isReadOnly = signal<boolean>(true);
    readonly talks = model<Talk[]>([]);
    configuration: TimelineData | undefined;
    private readonly salonService = inject(SalonService);
    private readonly conferenceService = inject(ConferenceService);
    private readonly workshopService = inject(WorkshopService);
    private readonly activatedRoute = inject(ActivatedRoute);
    private idSalon!: string;

    get hasConfiguration(): boolean {
        return (this.configuration?.days?.length ?? 0) > 0;
    }

    ngOnInit(): void {
        this.activatedRoute.paramMap
            .pipe(
                map(params => params.get('idSalon')!),
                tap(idSalon => (this.idSalon = idSalon)),
                tap(() => this.isLoading.set(true)),
                switchMap(idSalon =>
                              forkJoin({
                                           // 1) load planning (config + placements)
                                           planning: this.salonService.getPlanningTalks(idSalon),
                                           // 2) load talks sources
                                           conferences: this.conferenceService
                                                            .query({idSalon})
                                                            .pipe(map(confs => confs.filter(conf => conf.status !== Status.REFUSED && conf.status !== Status.CANCELED))),
                                           workshops: this.workshopService
                                                          .query({idSalon})
                                                          .pipe(map(works => works.filter(work => work.status !== Status.REFUSED && work.status !== Status.CANCELED)))
                                       }).pipe(finalize(() => this.isLoading.set(false)))
                ),
                map(({planning, conferences, workshops}) => {
                    // --- configuration
                    const configuration: TimelineData = planning?.configuration
                                                        ? this.fromTimelineDto(planning.configuration)
                                                        : this.buildConfiguration(this.idSalon);

                    // --- talks complets (depuis conf + workshop)
                    const baseTalks: Talk[] = [
                        ...conferences.map(con => this.toTalk(con, 'CONFERENCE', 60, 45)),
                        ...workshops.map(work => this.toTalk(work, 'WORKSHOP', 75, 60))
                    ];

                    // --- merge placements sauvegardés
                    const savedMap = new Map<string, TalkPlanningSaveDto>(
                        (planning?.talks ?? []).map(t => [`${t.type}:${t.id}`, t])
                    );

                    const mergedTalks = baseTalks.map(t => {
                        const saved = savedMap.get(`${t.type}:${t.id}`);
                        return saved
                               ? {
                                ...t,
                                roomId: saved.roomId,
                                dayId: saved.dayId,
                                startSlot: saved.startSlot
                            }
                               : t;
                    });

                    return {configuration, mergedTalks};
                })
            )
            .subscribe(({configuration, mergedTalks}) => {
                this.configuration = configuration;
                this.talks.set(mergedTalks);
            });
    }

    activateReadOnlyMode(): void {
        this.isReadOnly.set(true);
        this.ngOnInit();
    }

    activateEditMode(): void {
        this.isReadOnly.set(false);
    }

    save(): void {
        if (!this.configuration) {
            return;
        }

        const payload: PlanningTalksDto = {
            configuration: this.toTimelineDto(this.configuration),
            talks: this.talks().map(t => this.toTalkSaveDto(t))
        };

        this.isLoading.set(true);
        this.salonService
            .savePlanningTalks(this.idSalon, payload)
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe(() => {
                this.activateReadOnlyMode();
            });
    }

    previousState(): void {
        window.history.back();
    }

    private buildConfiguration(eventId: string): TimelineData {
        const rooms: TimelineRoom[] = [];
        const days: TimelineDay[] = [];

        return {
            eventId,
            intervalMinutes: 30,
            days,
            rooms
        };
    }

    private toTalk(talk: IWorkshop | IConference, type: TalkType, durationTotal: number, duration: number): Talk {
        return {
            id: talk.id,
            type,
            client: talk.participation.therapistName,
            durationTotalMinutes: durationTotal,
            durationTalkMinutes: duration,
            title: talk.title,
            description: talk.description,
            roomId: null,
            dayId: null,
            startSlot: 0,
            status: talk.status,
            extraInformation: talk.extraInformation,
            participation: {
                therapistName: talk.participation.therapistName,
                fullName: getExhibitorFullName(talk.participation.exhibitor)
            }
        };
    }

    private toTalkSaveDto(t: Talk): TalkPlanningSaveDto {
        return {
            id: String(t.id),
            type: t.type as TalkType,
            roomId: t.roomId,
            dayId: t.dayId,
            startSlot: t.startSlot
        };
    }

    private fromTimelineDto(dto: TimelineDataDto): TimelineData {
        return {
            eventId: dto.eventId,
            intervalMinutes: dto.intervalMinutes,
            days: dto.days.map(day => ({
                id: day.id,
                label: day.label,
                rooms: day.rooms.map(room => ({
                    roomId: room.roomId,
                    startingHour: new Date(room.startingHour),
                    endingHour: new Date(room.endingHour)
                }))
            })),
            rooms: dto.rooms.map(room => ({
                id: room.id,
                label: room.label
            }))
        };
    }

    private toTimelineDto(data: TimelineData): TimelineDataDto {
        return {
            eventId: data.eventId,
            intervalMinutes: data.intervalMinutes,
            days: data.days.map(day => ({
                id: day.id,
                label: day.label,
                rooms: day.rooms.map(room => ({
                    roomId: room.roomId,
                    startingHour: room.startingHour.toISOString(),
                    endingHour: room.endingHour.toISOString()
                }))
            })),
            rooms: data.rooms.map(room => ({
                id: room.id,
                label: room.label
            }))
        };
    }
}

export type TalkType = 'WORKSHOP' | 'CONFERENCE';

export interface TalkPlanningSaveDto {
    id: string;
    type: TalkType;
    roomId: string | null;
    dayId: string | null;
    startSlot: number;
}

export interface TimelineRoomDto {
    id: string;
    label: string;
}

export interface TimelineDayDto {
    id: string;
    label: string;
    rooms: TimeLineRoomDataDto[];
}

export interface TimelineDataDto {
    eventId: string;
    intervalMinutes: IntervalMinutes;
    days: TimelineDayDto[];
    rooms: TimelineRoomDto[];
}

export interface TimeLineRoomDataDto {
    roomId: string;
    startingHour: string;
    endingHour: string;
}

export interface PlanningTalksDto {
    configuration: TimelineDataDto;
    talks: TalkPlanningSaveDto[];
}