import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChildren,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    Injector,
    input,
    model,
    NgZone,
    signal
} from '@angular/core';
import {NgTemplateOutlet} from '@angular/common';
import {TranslatePipe} from '@ngx-translate/core';

import {NotifBadgeComponent} from '../notif-badge/notif-badge.component';
import {SideLabelComponent} from './side-label.component';

@Component({
               selector: 'app-side-labels',
               standalone: true,
               imports: [NgTemplateOutlet, TranslatePipe, NotifBadgeComponent],
               templateUrl: './side-labels.component.html',
               styleUrl: './side-labels.component.scss',
               changeDetection: ChangeDetectionStrategy.OnPush,
               host: {'(keydown.escape)': 'onEscape()'}
           })
export class SideLabelsComponent {
    readonly open = model<string | null>(null);
    /** Élément sur lequel aligner le haut (ex. le cadre d'app-tabs). */
    readonly anchor = input<HTMLElement | null>(null);

    readonly labels = contentChildren(SideLabelComponent);

    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly zone = inject(NgZone);
    private readonly destroyRef = inject(DestroyRef);
    private readonly injector = inject(Injector);

    readonly sideTop = signal(0);

    readonly openLabel = computed(() => {
        const key = this.open();

        return key ? (this.labels().find(label => label.key() === key) ?? null) : null;
    });

    readonly panelHint = computed(() => {
        const label = this.openLabel();
        if (!label) {
            return null;
        }
        const hintKey = label.hintKey();
        if (!hintKey) {
            return null;
        }
        const badge = label.badge();
        const isAlert = badge?.type === 'warning' || badge?.type === 'danger' || label.hintType() === 'info';

        return isAlert ? {key: hintKey, type: label.hintType()} : null;
    });

    constructor() {
        effect(() => {
            this.anchor();
            this.open();
            this.scheduleTop();
        });

        // À l'ouverture, le focus va sur le bouton Fermer.
        effect(() => {
            if (this.open()) {
                afterNextRender(() => {
                    const close = this.host.nativeElement.querySelector<HTMLElement>('.app-side-close');
                    close?.focus();
                }, {injector: this.injector});
            }
        });

        afterNextRender(() => {
            this.scheduleTop();
            this.observe();
        });
    }

    toggle(key: string): void {
        this.open.update(current => (current === key ? null : key));
    }

    close(): void {
        const key = this.open();
        this.open.set(null);
        if (key) {
            this.focusPill(key);
        }
    }

    onEscape(): void {
        if (this.open()) {
            this.close();
        }
    }

    private focusPill(key: string): void {
        afterNextRender(() => {
            const pill = this.host.nativeElement.querySelector<HTMLElement>(`[data-pill-key="${CSS.escape(key)}"]`);
            pill?.focus();
        }, {injector: this.injector});
    }

    private hostBox(): HTMLElement | null {
        return this.host.nativeElement.closest<HTMLElement>('.app-side-host');
    }

    private scheduleTop(): void {
        if (typeof requestAnimationFrame === 'undefined') {
            return;
        }
        this.zone.runOutsideAngular(() => requestAnimationFrame(() => this.computeTop()));
    }

    private computeTop(): void {
        const anchor = this.anchor();
        const box = this.hostBox();
        if (!anchor || !box) {
            return;
        }
        const top = Math.max(0, anchor.getBoundingClientRect().top - box.getBoundingClientRect().top);
        if (Math.abs(top - this.sideTop()) > 0.5) {
            this.zone.run(() => this.sideTop.set(top));
        }
    }

    private observe(): void {
        if (typeof ResizeObserver === 'undefined') {
            return;
        }
        this.zone.runOutsideAngular(() => {
            const observer = new ResizeObserver(() => this.computeTop());
            const box = this.hostBox();
            if (box) {
                observer.observe(box);
            }
            const anchor = this.anchor();
            if (anchor) {
                observer.observe(anchor);
            }
            this.destroyRef.onDestroy(() => observer.disconnect());
        });
    }
}
