import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {ActivatedRoute, RouterModule} from '@angular/router';
import {finalize} from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import {FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';

import {WorkshopService} from '../service/workshop.service';
import {IWorkshop} from '../model/workshop.interface';
import {WorkshopFormGroup, WorkshopFormService} from '../service/workshop-form.service';
import {IParticipation, selectFilterParticipation, getParticipationUsageName} from '../../participation/model/participation.interface';
import {formatterParticipation, ParticipationService} from '../../participation/service/participation.service';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {TextareaBoxComponent} from '../../../shared/components/textarea-box/textarea-box.component';
import {TextBoxComponent} from '../../../shared/components/text-box/text-box.component';
import {SelectBoxComponent} from '../../../shared/components/select-box/select-box.component';
import {AlertErrorComponent} from '../../../shared/alert/alert-error.component';
import {ConfirmPopup} from 'primeng/confirmpopup';
import {CardComponent} from '../../../shared/components/card/card.component';
import {ContentPageComponent} from 'app/shared/components/content-page/content-page.component';
import {FieldListComponent} from '../../../shared/components/field-list/field-list.component';
import {FieldRowComponent} from '../../../shared/components/field-list/field-row.component';
import {StatusTimelineComponent, StatusTimelineActionRequest} from '../../../shared/components/status-timeline/status-timeline.component';
import {NavigationStateService} from '../../../layouts/navbar/navigation-state.service';
import {loadParticipationOptions} from '../../common/participation/participation-options.util';
import {ActionsService} from '../../common/actions.service';
import {AvailableAction} from '../../../shared/model/available-action';
import {EntityAction} from '../../../shared/components/entity-list/entity-list.model';
import {getExhibitorFullName} from '../../exhibitor/model/exhibitor.interface';
import {DetailPageLayoutComponent} from '../../../shared/components/detail-page-layout/detail-page-layout.component';
import {
    DetailCreateActionsDirective,
    DetailMainDirective,
    DetailSideDirective,
    DetailStatusDirective
} from '../../../shared/components/detail-page-layout/detail-page-layout-slots.directive';
import {DetailSectionCardComponent} from '../../../shared/components/detail-section-card/detail-section-card.component';
import {TabsComponent} from '../../../shared/components/tabs/tabs.component';
import {TabPanelDirective} from '../../../shared/components/tabs/tab-panel.directive';
import {SideLabelsComponent} from '../../../shared/components/side-labels/side-labels.component';
import {SideLabelComponent} from '../../../shared/components/side-labels/side-label.component';
import {SideLabelHostDirective} from '../../../shared/components/side-labels/side-label-host.directive';
import {Notif} from '../../../shared/components/notif-badge/notif.model';
import {AppTab} from '../../../shared/components/tabs/tab-panel.directive';

@Component({
               selector: 'app-workshop-update',
               templateUrl: './workshop-update.component.html',
               styleUrl: './workshop-update.component.scss',
               imports: [SharedModule, RouterModule, FormsModule, ReactiveFormsModule, ButtonBoxComponent,
                         TextareaBoxComponent, TextBoxComponent, SelectBoxComponent, AlertErrorComponent,
                         ConfirmPopup, CardComponent, ContentPageComponent,
                         FieldListComponent, FieldRowComponent, StatusTimelineComponent,
                         DetailPageLayoutComponent, DetailStatusDirective, DetailMainDirective,
                         DetailSideDirective, DetailCreateActionsDirective, DetailSectionCardComponent,
                         TabsComponent, TabPanelDirective, SideLabelsComponent, SideLabelComponent,
                         SideLabelHostDirective]
           })
export class WorkshopUpdateComponent implements OnInit {
    isLoading = false;
    isReadOnly = false;
    eventId!: string;
    initialWorkshop: IWorkshop | null = null;
    participationsOptions: IParticipation[] = [];
    viewTab = 'ess';
    readonly side = signal<string | null>(null);
    readonly viewTabs: AppTab[] = [{key: 'ess', labelKey: 'global.tab.essential', icon: 'pi pi-star'}];
    readonly activeSection = signal<string | null>(null);
    readonly availableActions = signal<AvailableAction[]>([]);
    private sectionSnapshot: Record<string, unknown> = {};

    protected workshopService = inject(WorkshopService);
    protected workshopFormService = inject(WorkshopFormService);
    editForm: FormGroup<WorkshopFormGroup> = this.workshopFormService.createWorkshopFormGroup(null);
    protected participationService = inject(ParticipationService);
    protected navigationStateService = inject(NavigationStateService);
    protected activatedRoute = inject(ActivatedRoute);
    protected actionsService = inject(ActionsService);
    protected readonly formatterParticipation = formatterParticipation;
    protected readonly selectFilterParticipation = selectFilterParticipation;
    protected readonly getExhibitorFullName = getExhibitorFullName;
    protected readonly getParticipationUsageName = getParticipationUsageName;
    readonly subtitle = computed(() => this.navigationStateService.currentSalonPlace(this.eventId));

    readonly presentationActions = computed<EntityAction[]>(() => {
        if (this.isCreating || this.activeSection()) {
            return [];
        }
        return [{labelKey: 'common.edit', icon: 'pi pi-pencil', run: () => this.beginSection('presentation')}];
    });

    readonly internalActions = computed<EntityAction[]>(() => {
        if (this.isCreating || this.activeSection()) {
            return [];
        }
        return [{labelKey: 'common.edit', icon: 'pi pi-pencil', run: () => this.beginSection('internal')}];
    });

    get isCreating(): boolean {
        return !this.editForm.controls.id.value;
    }

    private get exhibitor() {
        return this.editForm.controls.participation.value?.exhibitor;
    }

    get intervenantBadge(): Notif | null {
        const exhibitor = this.exhibitor;
        const count = (exhibitor?.redFlag ? 1 : 0) + (exhibitor?.duplicateDetected ? 1 : 0);

        return count > 0 ? {type: 'danger', value: count} : null;
    }

    get intervenantHintKey(): string | null {
        return this.intervenantBadge ? 'common.exhibitorHasAlert' : null;
    }

    get participationBadge(): Notif | null {
        const participation = this.editForm.controls.participation.value;
        const count = (participation?.crushOfHeart ? 1 : 0) + (participation?.guestOfHonor ? 1 : 0);

        return count > 0 ? {type: 'warning', value: count} : null;
    }

    get internalBadge(): Notif | null {
        return this.editForm.controls.extraInformation.value ? {type: 'warning', dot: true} : null;
    }

    ngOnInit(): void {
        const data = this.activatedRoute.snapshot.data;
        this.eventId = this.activatedRoute.snapshot.paramMap.get('idSalon')!;
        const participationId = this.activatedRoute.snapshot.paramMap.get('idParticipation')!;
        this.initialWorkshop = data['workshop'] ? {...data['workshop']} : null;
        this.editForm = this.workshopFormService.createWorkshopFormGroup(this.initialWorkshop);
        this.isReadOnly = !!data['readonly'];

        if (this.isCreating) {
            this.editForm.enable();
        } else {
            this.editForm.disable();
            this.loadStatusActions(this.initialWorkshop?.id);
        }

        this.loadRelationshipsOptions(this.eventId, participationId);
    }

    beginSection(section: string): void {
        if (!this.initialWorkshop?.id || this.activeSection()) {
            return;
        }
        this.activeSection.set(section);
        this.sectionSnapshot = this.snapshot(section);
        if (section === 'presentation') {
            this.editForm.controls.title.enable();
            this.editForm.controls.description.enable();
        } else {
            this.editForm.controls.extraInformation.enable();
        }
    }

    cancelSection(section: string): void {
        Object.entries(this.sectionSnapshot).forEach(([name, value]) => this.editForm.get(name)?.setValue(value));
        this.resetSectionControls(section);
        this.activeSection.set(null);
    }

    saveSection(section: string): void {
        const names = section === 'presentation' ? ['title', 'description'] : ['extraInformation'];
        if (names.some(name => this.editForm.get(name)?.invalid)) {
            names.forEach(name => this.editForm.get(name)?.markAsTouched());
            return;
        }

        const payload: Partial<IWorkshop> = {id: this.initialWorkshop!.id};
        names.forEach(name => {
            (payload as Record<string, unknown>)[name] = this.editForm.get(name)?.value;
        });
        this.isLoading = true;
        this.workshopService.patch(this.initialWorkshop!.id, payload).pipe(finalize(() => (this.isLoading = false))).subscribe(workshop => {
            this.initialWorkshop = workshop;
            this.editForm.patchValue(workshop);
            this.resetSectionControls(section);
            this.activeSection.set(null);
        });
    }

    previousState(): void {
        window.history.back();
    }

    save(): void {
        if (this.editForm.invalid) {
            this.editForm.markAllAsTouched();
            return;
        }
        this.isLoading = true;
        const workshop = this.workshopFormService.getWorkshop(this.editForm);
        const saveOperation = workshop.id != null
                              ? this.workshopService.update(workshop)
                              : this.workshopService.create(workshop);
        saveOperation.pipe(finalize(() => (this.isLoading = false))).subscribe(() => this.previousState());
    }

    onStatusAction(request: StatusTimelineActionRequest): void {
        this.isLoading = true;
        this.actionsService.businessAction(request.action.contextCode, this.initialWorkshop!.id)
            .pipe(finalize(() => (this.isLoading = false)))
            .subscribe(() => this.reloadWorkshop());
    }

    private reloadWorkshop(): void {
        this.workshopService.find(this.initialWorkshop!.id).subscribe(response => {
            this.initialWorkshop = response.body;
            if (response.body) {
                this.editForm = this.workshopFormService.createWorkshopFormGroup(response.body);
                this.editForm.disable();
                this.loadStatusActions(response.body.id);
            }
        });
    }

    private loadStatusActions(id: string | undefined): void {
        if (id) {
            this.actionsService.getAvailableActions('workshop', id).subscribe(actions => this.availableActions.set(actions));
        }
    }

    private snapshot(section: string): Record<string, unknown> {
        const names = section === 'presentation' ? ['title', 'description'] : ['extraInformation'];
        return Object.fromEntries(names.map(name => [name, this.editForm.get(name)?.value]));
    }

    private resetSectionControls(section: string): void {
        const names = section === 'presentation' ? ['title', 'description'] : ['extraInformation'];
        names.forEach(name => this.editForm.get(name)?.disable());
    }

    private loadRelationshipsOptions(eventId: string, participationId: string | null): void {
        loadParticipationOptions(eventId, participationId, this.participationService,
            participation => this.editForm.get('participation')?.setValue(participation))
            .subscribe(participations => (this.participationsOptions = participations));
    }
}
