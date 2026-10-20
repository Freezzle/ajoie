import {ChangeDetectionStrategy, Component, computed, effect, HostListener, inject, OnInit, signal} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {BreakpointObserver} from '@angular/cdk/layout';
import {toSignal} from '@angular/core/rxjs-interop';
import {map} from 'rxjs';

import {ToastModule} from 'primeng/toast';
import {MessageService} from 'primeng/api';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';

import {ContentPageComponent} from '../../../shared/components/content-page/content-page.component';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {AlertErrorComponent} from '../../../shared/alert/alert-error.component';
import {CardComponent} from '../../../shared/components/card/card.component';
import {MenuBoxComponent} from '../../../shared/components/menu-box/menu-box.component';
import {DialogBoxComponent} from '../../../shared/components/dialog-box/dialog-box.component';
import {BottomSheetComponent} from '../../../shared/components/bottom-sheet/bottom-sheet.component';

import {ConflictLine, PlanningDayBarComponent} from './desktop/planning-day-bar.component';
import {PlaceEvent, PlanningGridComponent, SlotEvent} from './desktop/planning-grid.component';
import {PlanningSidePanelComponent} from './desktop/planning-side-panel.component';
import {TalkTrayComponent} from './desktop/talk-tray.component';
import {SlotCandidatesComponent} from './desktop/slot-candidates.component';
import {TalkInHandDirective} from './desktop/talk-in-hand.directive';
import {PlanningMobileComponent, RoomPill} from './mobile/planning-mobile.component';
import {StartOption, TalkDetailPanelComponent} from './talk-detail-panel.component';
import {TalksConfigDialogComponent} from './talks-config-dialog.component';

import {hhmm, isPlaced, Talk, talkKey, TimelineData} from './talks-planning-model';
import {TalksPlanningStore, TrayFilter} from './talks-planning.store';
import {
    checkPlacement,
    ConflictReason,
    findRoomLabel,
    firstFreeStart,
    issuesOf,
    startCandidates
} from './talks-planning-utils';

type MobileSheet = 'NONE' | 'TRAY' | 'SLOT' | 'DETAIL';

@Component({
               selector: 'talks-planning',
               standalone: true,
               imports: [
                   ToastModule,
                   TranslatePipe,

                   ContentPageComponent,
                   ButtonBoxComponent,
                   AlertErrorComponent,
                   CardComponent,
                   MenuBoxComponent,
                   DialogBoxComponent,
                   BottomSheetComponent,

                   PlanningDayBarComponent,
                   PlanningGridComponent,
                   PlanningSidePanelComponent,
                   TalkTrayComponent,
                   SlotCandidatesComponent,
                   TalkInHandDirective,
                   PlanningMobileComponent,
                   TalkDetailPanelComponent,
                   TalksConfigDialogComponent
               ],
               providers: [TalksPlanningStore],
               templateUrl: './talks-planning.component.html',
               styleUrl: './talks-planning.component.scss',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class TalksPlanningComponent implements OnInit {
    readonly store = inject(TalksPlanningStore);

    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly breakpointObserver = inject(BreakpointObserver);
    private readonly messageService = inject(MessageService);
    private readonly translate = inject(TranslateService);

    readonly isMobile = toSignal(
        this.breakpointObserver.observe('(max-width: 991.98px)').pipe(map(state => state.matches)),
        {initialValue: false}
    );

    readonly configDialogVisible = signal(false);
    readonly mobileSheet = signal<MobileSheet>('NONE');

    constructor() {
        // Les messages du store sont traduits ici : la logique métier reste hors de l'UI.
        effect(() => {
            const toast = this.store.toast();
            if (!toast) {
                return;
            }
            const base = this.translateText(toast.key, toast.params ?? {});
            const detail = toast.reason
                           ? `${base}${this.translateText(toast.reason.key, toast.reason.params)}`
                           : base;
            this.messageService.add({key: 'bottom-center', severity: 'info', detail});
        });

        // Mobile : si la salle affichée n'a plus de place pour l'intervention en main,
        // on bascule sur la première salle qui en a.
        effect(() => {
            if (!this.isMobile() || !this.store.talkInHand()) {
                return;
            }
            const pills = this.mobilePills();
            const currentId = this.store.mobileRoom()?.room.id ?? null;
            const current = pills.find(pill => pill.room.room.id === currentId);
            if (current?.firstFree === null) {
                const available = pills.find(pill => pill.firstFree !== null);
                if (available) {
                    this.store.mobileRoomId.set(available.room.room.id);
                }
            }
        });
    }

    ngOnInit(): void {
        this.activatedRoute.paramMap
            .pipe(map(params => params.get('idSalon')!))
            .subscribe(idSalon => this.store.load(idSalon));
    }

    // ---------- en-tête ----------

    previousState(): void {
        window.history.back();
    }

    save(): void {
        this.store.save(() => this.store.activateReadOnlyMode());
    }

    // ---------- libellés ----------

    readonly conflictTitles = computed<Map<string, string>>(() => {
        const config = this.store.configuration();
        const titles = new Map<string, string>();
        if (!config) {
            return titles;
        }
        const talks = this.store.talks();
        for (const talk of this.store.conflicts()) {
            const reasons = issuesOf(talk, talks, config);
            titles.set(talkKey(talk), reasons.map(reason => this.translateReason(reason)).join(' · '));
        }
        return titles;
    });

    readonly conflictLines = computed<ConflictLine[]>(() => {
        const config = this.store.configuration();
        if (!config) {
            return [];
        }
        const talks = this.store.talks();
        return this.store.conflicts().map(talk => {
            const day = config.days.find(entry => entry.id === talk.dayId);
            return {
                key: talkKey(talk),
                title: talk.title,
                position: `${day?.label ?? ''} · ${hhmm(talk.startMinute ?? 0)}`,
                reason: this.translateReason(issuesOf(talk, talks, config)[0])
            };
        });
    });

    readonly slotTitle = computed(() => {
        const slot = this.store.selectedSlot();
        const config = this.store.configuration();
        if (!slot || !config) {
            return '';
        }
        const day = config.days.find(entry => entry.id === slot.dayId);
        return `${day?.label ?? ''} — ${findRoomLabel(config, slot.roomId)} · ${hhmm(slot.startMinute)}`;
    });

    readonly slotSubtitle = computed(() => {
        const slot = this.store.selectedSlot();
        return slot ? this.translateText('planningTalks.slot.subtitle', {time: hhmm(slot.startMinute)}) : '';
    });

    readonly inHandBanner = computed(() => {
        const talk = this.store.talkInHandValue();
        if (!talk) {
            return '';
        }
        return this.translateText('planningTalks.inHand.banner', {
            title: talk.title,
            durations: this.durationsOf(talk)
        });
    });

    readonly detailReasons = computed<ConflictReason[]>(() => {
        const talk = this.store.selectedTalk();
        return talk ? this.store.issuesOfTalk(talk) : [];
    });

    readonly detailStartOptions = computed<StartOption[]>(() => {
        const talk = this.store.selectedTalk();
        const config = this.store.configuration();
        if (!talk || !config || !talk.dayId || !talk.roomId) {
            return [];
        }
        const talks = this.store.talks();
        const busy = this.translateText('planningTalks.details.busy');
        return startCandidates(talk, config, talk.dayId, talk.roomId).map(minute => {
            const ok = checkPlacement(talk, talks, config, talk.dayId, talk.roomId, minute).ok;
            return {minute, label: ok ? hhmm(minute) : `${hhmm(minute)} · ${busy}`};
        });
    });

    /** Nombre d'interventions placées par jour, pour la confirmation de suppression dans la popin. */
    readonly placedByDay = computed<Map<string, number>>(() => {
        const counts = new Map<string, number>();
        for (const talk of this.store.talks()) {
            if (isPlaced(talk)) {
                counts.set(talk.dayId!, (counts.get(talk.dayId!) ?? 0) + 1);
            }
        }
        return counts;
    });

    readonly mobilePills = computed<RoomPill[]>(() => {        const config = this.store.configuration();
        const day = this.store.selectedDay();
        const talk = this.store.talkInHandValue();
        if (!config || !day) {
            return [];
        }
        return this.store.gridRooms().map(room => ({
            room,
            firstFree: talk ? firstFreeStart(talk, this.store.talks(), config, day.id, room.room.id) : null
        }));
    });

    durationsOf(talk: Talk): string {
        return this.translateText('planningTalks.durations.short', {
            prep: talk.preparationMinutes,
            dur: talk.durationTalkMinutes,
            clean: talk.cleanupMinutes
        });
    }

    // ---------- interactions ----------

    onSlotClick(slot: SlotEvent): void {
        this.store.selectSlot(slot);
        if (this.isMobile()) {
            this.mobileSheet.set('SLOT');
        }
    }

    onTalkClick(key: string): void {
        this.store.selectTalk(key);
        if (this.isMobile()) {
            this.mobileSheet.set('DETAIL');
        }
    }

    onPlaceRequest(event: PlaceEvent): void {
        this.store.place(event.key, event.dayId, event.roomId, event.startMinute);
        this.store.dropInHand();
        this.mobileSheet.set('NONE');
    }

    /** Presser une carte du bac l'arme immédiatement : le glisser affiche l'aperçu dans la grille. */
    onTrayDragStart(event: { talk: Talk; event: PointerEvent }): void {
        if (this.store.isEditing() && !this.store.selectedSlot()) {
            this.store.takeInHand(talkKey(event.talk));
        }
    }

    onTrayTalkChosen(talk: Talk): void {        const key = talkKey(talk);
        if (!this.store.isEditing()) {
            this.onTalkClick(key);
            return;
        }
        const slot = this.store.selectedSlot();
        if (slot) {
            this.store.place(key, slot.dayId, slot.roomId, slot.startMinute);
            this.store.selectSlot(null);
            this.mobileSheet.set('NONE');
            return;
        }
        this.store.takeInHand(key);
        this.mobileSheet.set('NONE');
    }

    onSlotPlace(key: string): void {
        const slot = this.store.selectedSlot();
        if (slot) {
            this.store.place(key, slot.dayId, slot.roomId, slot.startMinute);
            this.mobileSheet.set('NONE');
        }
    }

    onDetailDayChanged(dayId: string): void {
        this.moveSelected(talk => ({...talk, dayId}));
    }

    onDetailRoomChanged(roomId: string): void {
        this.moveSelected(talk => ({...talk, roomId}));
    }

    onDetailStartChanged(startMinute: number): void {
        this.moveSelected(talk => ({...talk, startMinute}));
    }

    onChooseOnGrid(): void {
        const talk = this.store.selectedTalk();
        if (talk) {
            this.store.takeInHand(talkKey(talk));
            this.store.selectTalk(null);
            this.mobileSheet.set('NONE');
        }
    }

    onDetailRemove(): void {
        const talk = this.store.selectedTalk();
        if (talk) {
            this.store.unplace(talkKey(talk));
        }
    }

    onFocusTherapist(name: string): void {
        this.store.focusTherapist.set(this.store.focusTherapist() === name ? null : name);
    }

    onTrayFilterChanged(filter: TrayFilter): void {
        this.store.trayFilter.set(filter);
    }

    onTrayQueryChanged(query: string): void {
        this.store.trayQuery.set(query);
    }

    applyConfiguration(draft: TimelineData | null): void {
        if (draft) {
            this.store.applyConfiguration(draft);
        }
        this.configDialogVisible.set(false);
    }

    openMobileTray(): void {
        this.store.selectSlot(null);
        this.mobileSheet.set('TRAY');
    }

    closeMobileSheet(): void {
        this.mobileSheet.set('NONE');
    }

    private moveSelected(mutate: (talk: Talk) => Talk): void {
        const talk = this.store.selectedTalk();
        if (!talk) {
            return;
        }
        const next = mutate(talk);
        if (next.dayId && next.roomId && next.startMinute !== null) {
            this.store.place(talkKey(talk), next.dayId, next.roomId, next.startMinute);
        }
    }

    // ---------- raccourcis ----------

    @HostListener('document:keydown', ['$event'])
    onKeyDown(event: KeyboardEvent): void {
        const target = event.target as HTMLElement | null;
        if (target?.closest('input, select, textarea, .p-dialog')) {
            return;
        }
        if (event.key === 'Escape') {
            if (this.store.talkInHand()) {
                this.store.dropInHand();
            } else if (this.store.selectedTalkKey()) {
                this.store.selectTalk(null);
            } else if (this.store.selectedSlot()) {
                this.store.selectSlot(null);
            } else if (this.store.focusTherapist()) {
                this.store.focusTherapist.set(null);
            }
            this.mobileSheet.set('NONE');
            return;
        }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && this.store.isEditing()) {
            event.preventDefault();
            this.store.undo();
        }
    }

    private translateReason(reason: ConflictReason | undefined): string {
        return reason ? this.translateText(reason.key, reason.params) : '';
    }

    private translateText(key: string, params?: Record<string, string | number>): string {
        return String(this.translate.instant(key, params));
    }
}
