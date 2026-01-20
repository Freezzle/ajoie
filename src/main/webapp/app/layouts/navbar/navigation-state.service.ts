import {computed, Injectable, signal} from '@angular/core';
import {ISalon} from '../../admin/salon/model/salon.interface';

@Injectable({providedIn: 'root'})
export class NavigationStateService {
    private readonly _salon = signal<ISalon | null>(null);
    private isUpdating = false;

    readonly salon = computed(() => this._salon());
    readonly salonId = computed(() => this._salon()?.id ?? null);

    hideSensibleInformation = signal<boolean>(false);
    sidebarCollapsed = signal<boolean>(true);

    reset(): void {
        this._salon.set(null);
    }

    defineSalon(salon: ISalon): void {
        this._salon.set(salon);
    }

    isSameContext(idSalon: string): boolean {
        // on lit le signal via la computed salonId()
        return this.salonId() === idSalon;
    }

    toggleSidebar(): void {
        if (!this.isUpdating) {
            this.isUpdating = true;
            this.sidebarCollapsed.update(v => !v);
            setTimeout(() => { this.isUpdating = false; }, 100);
        }
    }
}