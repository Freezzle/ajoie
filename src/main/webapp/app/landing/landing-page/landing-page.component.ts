import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {RouterLink} from '@angular/router';

import {Button} from 'primeng/button';
import {Tag} from 'primeng/tag';
import {InputText} from 'primeng/inputtext';

import SharedModule from 'app/shared/shared.module';
import {
    LANDING_AUDIENCES,
    LANDING_MODULES,
    LandingModule,
    ModuleStatus,
    NOM_PRODUIT
} from '../landing-page.constants';
import {WaitlistService} from '../waitlist.service';

type ModuleFilter = 'all' | ModuleStatus;
type WaitlistState = 'idle' | 'error' | 'success';

/**
 * Nouvelle page d'accueil publique (hero Variante A : centré, sans illustration).
 * Remplace l'ancienne `HomeComponent`. Affichée sans le chrome applicatif (voir `data: {publicLayout: true}`
 * sur la route `''` dans `app.routes.ts`, géré par `MainComponent`).
 */
@Component({
               selector: 'app-landing-page',
               imports: [SharedModule, RouterLink, ReactiveFormsModule, Button, Tag, InputText],
               templateUrl: './landing-page.component.html',
               styleUrl: './landing-page.component.scss',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export default class LandingPageComponent {
    private readonly fb = inject(FormBuilder);
    private readonly waitlistService = inject(WaitlistService);

    readonly productName = NOM_PRODUIT;
    readonly modules = LANDING_MODULES;
    readonly audiences = LANDING_AUDIENCES;
    readonly currentYear = new Date().getFullYear();

    readonly activeFilter = signal<ModuleFilter>('all');
    readonly waitlistState = signal<WaitlistState>('idle');
    readonly confirmedEmail = signal<string>('');
    readonly highlightedModuleId = signal<string | null>(null);

    readonly readyCount = computed(() => this.modules.filter(module => module.status === 'ready').length);
    readonly soonCount = computed(() => this.modules.length - this.readyCount());
    readonly allCount = computed(() => this.modules.length);

    readonly filteredModules = computed<LandingModule[]>(() => {
        const filter = this.activeFilter();
        if (filter === 'all') {
            return this.modules;
        }
        return this.modules.filter(module => module.status === filter);
    });

    readonly waitlistForm = this.fb.nonNullable.group({
        email: ['', [Validators.required, Validators.email]]
    });

    setFilter(filter: ModuleFilter): void {
        this.activeFilter.set(filter);
    }

    /** Fait défiler la page en douceur jusqu'à la section/ancre donnée . */
    scrollTo(anchorId: string): void {
        document.getElementById(anchorId)?.scrollIntoView({behavior: 'smooth', block: 'start'});
    }

    submitWaitlist(): void {
        if (this.waitlistForm.invalid) {
            this.waitlistState.set('error');
            return;
        }

        const {email} = this.waitlistForm.getRawValue();
        this.waitlistService.subscribe(email).subscribe(() => {
            this.confirmedEmail.set(email);
            this.waitlistState.set('success');
            this.waitlistForm.reset({email: ''});
        });
    }
}

