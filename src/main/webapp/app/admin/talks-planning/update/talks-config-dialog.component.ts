import {ChangeDetectionStrategy, Component, computed, inject, Input, OnDestroy, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {toSignal} from '@angular/core/rxjs-interop';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {MessageService} from 'primeng/api';
import {DatePicker} from 'primeng/datepicker';
import {SelectButton} from 'primeng/selectbutton';

import {DialogDraftService} from '../../../shared/services/dialog-draft.service';
import {TextBoxComponent} from '../../../shared/components/text-box/text-box.component';
import {NumberBoxComponent} from '../../../shared/components/number-box/number-box.component';
import {DateBoxComponent} from '../../../shared/components/date-box/date-box.component';
import {CheckboxBoxComponent} from '../../../shared/components/checkbox-box/checkbox-box.component';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';

import {
    dateAtMinute,
    DEFAULT_ROOM_CLOSING_MINUTE,
    DEFAULT_ROOM_OPENING_MINUTE,
    DISPLAY_INTERVALS,
    DisplayIntervalMinutes,
    minutesOfDay,
    newId,
    PLACEMENT_INTERVALS,
    PlacementIntervalMinutes,
    TALK_TYPES,
    TalkType,
    TalkTypeConfig,
    TimelineData,
    TimelineDay
} from './talks-planning-model';

/** Contenu de la popin « Salles et horaires » (§6). Travaille sur un brouillon de formulaire. */
@Component({
               selector: 'talks-config-dialog',
               standalone: true,
               imports: [
                   ReactiveFormsModule,
                   TranslatePipe,
                   DatePicker,
                   SelectButton,
                   TextBoxComponent,
                   NumberBoxComponent,
                   DateBoxComponent,
                   CheckboxBoxComponent,
                   ButtonBoxComponent
               ],
               templateUrl: './talks-config-dialog.component.html',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class TalksConfigDialogComponent implements OnInit, OnDestroy {
    readonly types = TALK_TYPES;
    readonly displayOptions = DISPLAY_INTERVALS.map(value => ({label: `${value} min`, value}));
    readonly placementOptions = PLACEMENT_INTERVALS.map(value => ({label: `${value} min`, value}));

    /** Jour en attente de confirmation de suppression (il contient des interventions placées). */
    pendingDeleteIndex: number | null = null;

    private readonly fb = inject(FormBuilder);
    private readonly draftService = inject(DialogDraftService);
    private readonly messageService = inject(MessageService);
    private readonly translate = inject(TranslateService);

    private eventId = '';

    readonly form = this.fb.group({
                                      intervalMinutes: [30],
                                      placementIntervalMinutes: [15],
                                      CONFERENCE: this.buildTypeGroup(),
                                      WORKSHOP: this.buildTypeGroup(),
                                      rooms: this.fb.array<FormGroup>([]),
                                      days: this.fb.array<FormGroup>([])
                                  });

    /** Rafraîchit les valeurs calculées (« Salle occupée ») à chaque saisie. */
    private readonly formValue = toSignal(this.form.valueChanges, {initialValue: null});

    readonly occupiedByType = computed<Record<TalkType, number>>(() => {
        this.formValue();
        return {CONFERENCE: this.occupiedOf('CONFERENCE'), WORKSHOP: this.occupiedOf('WORKSHOP')};
    });

    @Input({required: true})
    set data(value: TimelineData) {
        this.fillForm(value);
    }

    /** Nombre d'interventions placées par jour, pour confirmer avant une suppression. */
    @Input()
    placedByDay: Map<string, number> = new Map();

    ngOnInit(): void {
        this.draftService.registerDraft(() => this.toTimelineData());
        this.draftService.registerValidate(() => this.validate());
    }

    ngOnDestroy(): void {
        this.draftService.unregisterDraft();
    }

    // ---------- accès au formulaire ----------

    get rooms(): FormArray<FormGroup> {
        return this.form.controls.rooms;
    }

    get days(): FormArray<FormGroup> {
        return this.form.controls.days;
    }

    typeGroup(type: TalkType): FormGroup {
        return this.form.controls[type];
    }

    slots(day: FormGroup): FormArray<FormGroup> {
        return day.controls['slots'] as FormArray<FormGroup>;
    }

    roomLabel(index: number): string {
        return String(this.rooms.at(index).controls['label'].value ?? '');
    }

    typeLabelKey(type: TalkType): string {
        return type === 'CONFERENCE' ? 'planningTalks.details.conference' : 'planningTalks.details.workshop';
    }

    placedCount(index: number): number {
        return this.placedByDay.get(String(this.days.at(index).controls['id'].value)) ?? 0;
    }

    isOpen(day: FormGroup, index: number): boolean {
        return this.slots(day).at(index).controls['open'].value === true;
    }

    // ---------- salles ----------

    addRoom(): void {
        const room = this.fb.group({id: [newId('room')], label: [`Salle ${this.rooms.length + 1}`]});
        this.rooms.push(room);
        for (const day of this.days.controls) {
            this.slots(day).push(
                this.buildSlotGroup(String(room.controls.id.value), day.controls['date'].value as Date, true));
        }
    }

    removeRoom(index: number): void {
        this.rooms.removeAt(index);
        for (const day of this.days.controls) {
            this.slots(day).removeAt(index);
        }
    }

    // ---------- jours ----------

    addDay(): void {
        const date = this.nextDayDate();
        const label = date.toLocaleDateString('fr-CH', {weekday: 'long', day: 'numeric', month: 'long'});
        this.days.push(this.buildDayGroup({id: newId('day'), label, rooms: []}, date, true));
    }

    requestRemoveDay(index: number): void {
        if (this.placedCount(index) > 0) {
            this.pendingDeleteIndex = index;
            return;
        }
        this.removeDay(index);
    }

    cancelRemoveDay(): void {
        this.pendingDeleteIndex = null;
    }

    removeDay(index: number): void {
        this.pendingDeleteIndex = null;
        this.days.removeAt(index);
    }

    // ---------- conversion ----------

    private occupiedOf(type: TalkType): number {
        const value = this.typeGroup(type).getRawValue() as Partial<TalkTypeConfig>;
        return (value.preparationMinutes ?? 0) + (value.durationTalkMinutes ?? 0) + (value.cleanupMinutes ?? 0);
    }

    private fillForm(config: TimelineData): void {
        this.eventId = config.eventId;
        this.form.patchValue({
                                 intervalMinutes: config.intervalMinutes,
                                 placementIntervalMinutes: config.placementIntervalMinutes,
                                 CONFERENCE: {...config.talkTypes.CONFERENCE},
                                 WORKSHOP: {...config.talkTypes.WORKSHOP}
                             });

        this.rooms.clear();
        for (const room of config.rooms) {
            this.rooms.push(this.fb.group({id: [room.id], label: [room.label]}));
        }

        this.days.clear();
        for (const day of config.days) {
            const date = day.rooms[0]?.startingHour ?? new Date();
            this.days.push(this.buildDayGroup(day, new Date(date), false));
        }
    }

    private toTimelineData(): TimelineData {
        const value = this.form.getRawValue();
        return {
            eventId: this.eventId,
            intervalMinutes: (value.intervalMinutes ?? 30) as DisplayIntervalMinutes,
            placementIntervalMinutes: (value.placementIntervalMinutes ?? 15) as PlacementIntervalMinutes,
            talkTypes: {
                CONFERENCE: this.typeGroup('CONFERENCE').getRawValue() as TalkTypeConfig,
                WORKSHOP: this.typeGroup('WORKSHOP').getRawValue() as TalkTypeConfig
            },
            rooms: this.rooms.controls.map(room => ({
                id: String(room.controls['id'].value),
                label: String(room.controls['label'].value ?? '').trim() || String(room.controls['id'].value)
            })),
            days: this.days.controls.map(day => {
                const date = day.controls['date'].value as Date;
                return {
                    id: String(day.controls['id'].value),
                    label: String(day.controls['label'].value ?? ''),
                    rooms: this.slots(day).controls
                               .filter(slot => slot.controls['open'].value === true)
                               .map(slot => ({
                                   roomId: String(slot.controls['roomId'].value),
                                   startingHour: this.combine(date, slot.controls['start'].value as Date),
                                   endingHour: this.combine(date, slot.controls['end'].value as Date)
                               }))
                };
            })
        };
    }

    // ---------- validation ----------

    private validate(): boolean {
        this.form.markAllAsTouched();

        for (const type of TALK_TYPES) {
            if (Number(this.typeGroup(type).controls['durationTalkMinutes'].value) < 5) {
                this.error('planningTalks.config.errorDuration', {type: this.translateText(this.typeLabelKey(type))});
                return false;
            }
        }

        for (const day of this.days.controls) {
            for (const slot of this.slots(day).controls) {
                if (slot.controls['open'].value !== true) {
                    continue;
                }
                const start = slot.controls['start'].value as Date | null;
                const end = slot.controls['end'].value as Date | null;
                if (!start || !end || minutesOfDay(end) <= minutesOfDay(start)) {
                    this.error('planningTalks.config.errorHours', {day: String(day.controls['label'].value ?? '')});
                    return false;
                }
            }
        }
        return true;
    }

    private error(key: string, params: Record<string, string>): void {
        this.messageService.add({key: 'bottom-center', severity: 'error', detail: this.translateText(key, params)});
    }

    // ---------- construction ----------

    private buildTypeGroup(): FormGroup {
        return this.fb.group({
                                 preparationMinutes: [0, [Validators.required, Validators.min(0)]],
                                 durationTalkMinutes: [45, [Validators.required, Validators.min(5)]],
                                 cleanupMinutes: [15, [Validators.required, Validators.min(0)]]
                             });
    }

    private buildDayGroup(day: TimelineDay, date: Date, openAll: boolean): FormGroup {
        return this.fb.group({
                                 id: [day.id],
                                 label: [day.label],
                                 date: [date],
                                 slots: this.fb.array<FormGroup>(
                                     this.rooms.controls.map(room => {
                                         const roomId = String(room.controls['id'].value);
                                         const data = day.rooms.find(entry => entry.roomId === roomId);
                                         return data
                                                ? this.buildSlotGroup(roomId, date, true, data.startingHour, data.endingHour)
                                                : this.buildSlotGroup(roomId, date, openAll);
                                     })
                                 )
                             });
    }

    private buildSlotGroup(roomId: string, date: Date, open: boolean, start?: Date, end?: Date): FormGroup {
        return this.fb.group({
                                 roomId: [roomId],
                                 open: [open],
                                 start: [start ? new Date(start) : dateAtMinute(date, DEFAULT_ROOM_OPENING_MINUTE)],
                                 end: [end ? new Date(end) : dateAtMinute(date, DEFAULT_ROOM_CLOSING_MINUTE)]
                             });
    }

    private nextDayDate(): Date {
        const last = this.days.length > 0
                     ? this.days.at(this.days.length - 1).controls['date'].value as Date
                     : null;
        const date = last ? new Date(last) : new Date();
        if (last) {
            date.setDate(date.getDate() + 1);
        }
        return date;
    }

    /** Applique l'heure choisie sur la date du jour. */
    private combine(date: Date, time: Date): Date {
        return dateAtMinute(date, minutesOfDay(time));
    }

    private translateText(key: string, params?: Record<string, string | number>): string {
        return String(this.translate.instant(key, params));
    }
}
