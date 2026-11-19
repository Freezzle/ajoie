import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {ActivatedRoute, RouterModule} from '@angular/router';
import {finalize} from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import {FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';

import {ConferenceService} from '../service/conference.service';
import {IConference} from '../model/conference.interface';
import {ConferenceFormGroup, ConferenceFormService} from '../service/conference-form.service';
import {IParticipation, selectFilterParticipation} from '../../participation/model/participation.interface';
import {formatterParticipation, ParticipationService} from '../../participation/service/participation.service';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {TextareaBoxComponent} from '../../../shared/components/textarea-box/textarea-box.component';
import {TextBoxComponent} from '../../../shared/components/text-box/text-box.component';
import {SelectBoxComponent} from '../../../shared/components/select-box/select-box.component';
import {AlertErrorComponent} from '../../../shared/alert/alert-error.component';
import {ConfirmPopup} from 'primeng/confirmpopup';
import {CardComponent} from '../../../shared/components/card/card.component';
import {CardFooterContentDirective} from '../../../shared/components/card/card-footer.directive';
import {ContentPageComponent} from 'app/shared/components/content-page/content-page.component';
import {FieldListComponent} from '../../../shared/components/field-list/field-list.component';
import {FieldRowComponent} from '../../../shared/components/field-list/field-row.component';
import {EntityStatusComponent} from '../../../shared/components/entity-list/entity-status.component';
import {statusColor} from '../../../shared/components/entity-list/entity-list.model';
import {StatusTimelineComponent, StatusTimelineActionRequest} from '../../../shared/components/status-timeline/status-timeline.component';
import {NavigationStateService} from '../../../layouts/navbar/navigation-state.service';
import {loadParticipationOptions} from '../../common/participation/participation-options.util';
import {ActionsService} from '../../common/actions.service';
import {AvailableAction} from '../../../shared/model/available-action';
import {EntityAction} from '../../../shared/components/entity-list/entity-list.model';
import {getExhibitorFullName} from '../../exhibitor/model/exhibitor.interface';

@Component({
               selector: 'app-conference-update',
               templateUrl: './conference-update.component.html',
               styleUrl: './conference-update.component.scss',
               imports: [SharedModule, RouterModule, FormsModule, ReactiveFormsModule, ButtonBoxComponent,
                         TextareaBoxComponent, TextBoxComponent, SelectBoxComponent,
                         AlertErrorComponent, ConfirmPopup, CardComponent, CardFooterContentDirective, ContentPageComponent,
                         FieldListComponent, FieldRowComponent, EntityStatusComponent, StatusTimelineComponent]
           })
export class ConferenceUpdateComponent implements OnInit {
    isLoading = false;
    isReadOnly = false;
    eventId!: string;
    initialConference: IConference | null = null;
    participationsOptions: IParticipation[] = [];
    readonly activeSection = signal<string | null>(null);
    readonly availableActions = signal<AvailableAction[]>([]);
    private sectionSnapshot: Record<string, unknown> = {};

    protected conferenceService = inject(ConferenceService);
    protected conferenceFormService = inject(ConferenceFormService);
    editForm: FormGroup<ConferenceFormGroup> = this.conferenceFormService.createConferenceFormGroup(null);
    protected participationService = inject(ParticipationService);
    protected navigationStateService = inject(NavigationStateService);
    protected activatedRoute = inject(ActivatedRoute);
    protected actionsService = inject(ActionsService);
    protected readonly formatterParticipation = formatterParticipation;
    protected readonly selectFilterParticipation = selectFilterParticipation;
    protected readonly getExhibitorFullName = getExhibitorFullName;
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

    ngOnInit(): void {
        const data = this.activatedRoute.snapshot.data;
        this.eventId = this.activatedRoute.snapshot.paramMap.get('idSalon')!;
        const participationId = this.activatedRoute.snapshot.paramMap.get('idParticipation')!;
        this.initialConference = data['conference'] ? {...data['conference']} : null;
        this.editForm = this.conferenceFormService.createConferenceFormGroup(this.initialConference);
        this.isReadOnly = !!data['readonly'];

        if (this.isCreating) {
            this.editForm.enable();
        } else {
            this.editForm.disable();
            this.loadStatusActions(this.initialConference?.id);
        }

        this.loadRelationshipsOptions(this.eventId, participationId);
    }

    beginSection(section: string): void {
        if (!this.initialConference?.id || this.activeSection()) {
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
        Object.entries(this.sectionSnapshot).forEach(([name, value]) => {
            this.editForm.get(name)?.setValue(value);
        });
        this.resetSectionControls(section);
        this.activeSection.set(null);
    }

    saveSection(section: string): void {
        const names = section === 'presentation' ? ['title', 'description'] : ['extraInformation'];
        const invalid = names.some(name => this.editForm.get(name)?.invalid);
        if (invalid) {
            names.forEach(name => this.editForm.get(name)?.markAsTouched());
            return;
        }

        const payload: Partial<IConference> = {id: this.initialConference!.id};
        names.forEach(name => {
            (payload as Record<string, unknown>)[name] = this.editForm.get(name)?.value;
        });
        this.isLoading = true;
        this.conferenceService.patch(this.initialConference!.id, payload).pipe(finalize(() => (this.isLoading = false))).subscribe(conference => {
            this.initialConference = conference;
            this.editForm.patchValue(conference);
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
        const conference = this.conferenceFormService.getConference(this.editForm);
        const saveOperation = conference.id != null
                              ? this.conferenceService.update(conference)
                              : this.conferenceService.create(conference);
        saveOperation.pipe(finalize(() => (this.isLoading = false))).subscribe(() => this.previousState());
    }

    onStatusAction(request: StatusTimelineActionRequest): void {
        this.isLoading = true;
        this.actionsService.businessAction(request.action.contextCode, this.initialConference!.id)
            .pipe(finalize(() => (this.isLoading = false)))
            .subscribe(() => this.reloadConference());
    }

    private reloadConference(): void {
        this.conferenceService.find(this.initialConference!.id).subscribe(response => {
            this.initialConference = response.body;
            if (response.body) {
                this.editForm = this.conferenceFormService.createConferenceFormGroup(response.body);
                this.editForm.disable();
                this.loadStatusActions(response.body.id);
            }
        });
    }

    private loadStatusActions(id: string | undefined): void {
        if (!id) {
            return;
        }
        this.actionsService.getAvailableActions('conference', id).subscribe(actions => this.availableActions.set(actions));
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
        loadParticipationOptions(
            eventId,
            participationId,
            this.participationService,
            participation => this.editForm.get('participation')?.setValue(participation)
        ).subscribe((participations) => (this.participationsOptions = participations));
    }

    protected readonly statusColor = statusColor;

    participationStatusLabelKey(status: string | null | undefined): string | null {
        return status ? `participation.list.status.${status}` : null;
    }
}
