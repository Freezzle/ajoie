import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChild,
    contentChildren,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    Injector,
    input,
    model,
    NgZone,
    signal,
    viewChild
} from '@angular/core';
import {NgTemplateOutlet} from '@angular/common';
import {TranslatePipe} from '@ngx-translate/core';

import {Notif} from '../notif-badge/notif.model';
import {NotifBadgeComponent} from '../notif-badge/notif-badge.component';
import {AppTab, TabBodyDirective, TabPanelDirective} from './tab-panel.directive';

@Component({
               selector: 'app-tabs',
               standalone: true,
               imports: [NgTemplateOutlet, TranslatePipe, NotifBadgeComponent],
               templateUrl: './tabs.component.html',
               styleUrl: './tabs.component.scss',
               changeDetection: ChangeDetectionStrategy.OnPush,
               host: {
                   '(document:click)': 'onDocumentClick($event)',
                   '(keydown.escape)': 'onEscape()'
               }
           })
export class TabsComponent {
    readonly tabs = input.required<AppTab[]>();
    readonly active = model<string>();
    readonly ariaLabelKey = input<string>('global.sections');
    readonly showNotifs = input<boolean>(true);
    /** Supprime le padding du panneau encadré (éditeurs plein cadre). */
    readonly flushBody = input<boolean>(false);

    private readonly listRef = viewChild<ElementRef<HTMLElement>>('list');

    private readonly panels = contentChildren(TabPanelDirective);
    private readonly body = contentChild(TabBodyDirective);
    private readonly zone = inject(NgZone);
    private readonly destroyRef = inject(DestroyRef);
    private readonly injector = inject(Injector);
    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

    readonly overflowKeys = signal<Set<string>>(new Set());
    readonly menuOpen = signal(false);

    readonly visibleTabs = computed(() => this.tabs().filter(tab => !tab.hidden));

    /** Mode cadre + panneaux si des templates appTabPanel sont fournis, sinon sélecteur simple. */
    readonly hasPanels = computed(() => this.panels().length > 0);

    /** Mode cadre avec corps projeté unique (onglets dynamiques). */
    readonly hasBody = computed(() => !!this.body());

    readonly activePanel = computed(() => {
        const key = this.active();

        return this.panels().find(panel => panel.key() === key) ?? null;
    });

    readonly hiddenTabs = computed(() => {
        const overflow = this.overflowKeys();

        return this.visibleTabs().filter(tab => overflow.has(tab.key));
    });

    /** Badge du bouton « Plus » : point d'alerte si un onglet caché en porte une, sinon le nombre. */
    readonly moreBadge = computed<Notif>(() => {
        const hidden = this.hiddenTabs();
        const hasAlert = hidden.some(tab => tab.badge?.type === 'warning' || tab.badge?.type === 'danger');
        if (hasAlert) {
            return {type: 'warning', dot: true};
        }

        return {type: 'count', value: hidden.length};
    });

    constructor() {
        // Choix d'un onglet actif par défaut, uniquement en mode cadre (avec panneaux).
        effect(() => {
            if (!this.hasPanels()) {
                return;
            }
            const current = this.active();
            const visible = this.visibleTabs();
            const stillValid = current !== undefined && visible.some(tab => tab.key === current && !tab.disabled);
            if (!stillValid) {
                const first = visible.find(tab => !tab.disabled);
                if (first && first.key !== current) {
                    this.active.set(first.key);
                }
            }
        });

        // Recalcul du débordement quand les onglets, l'actif ou les badges changent.
        effect(() => {
            this.tabs();
            this.active();
            this.showNotifs();
            this.scheduleFit();
        });

        afterNextRender(() => {
            this.scheduleFit();
            this.observeResize();
        });
    }

    select(tab: AppTab): void {
        if (tab.disabled) {
            return;
        }
        this.active.set(tab.key);
        this.menuOpen.set(false);
    }

    toggleMenu(): void {
        this.menuOpen.update(open => !open);
    }

    closeMenu(): void {
        this.menuOpen.set(false);
    }

    onDocumentClick(event: MouseEvent): void {
        if (!this.menuOpen()) {
            return;
        }
        const moreWrap = this.host.nativeElement.querySelector('.app-tabs-more');
        if (moreWrap && !moreWrap.contains(event.target as Node)) {
            this.menuOpen.set(false);
        }
    }

    onEscape(): void {
        if (this.menuOpen()) {
            this.menuOpen.set(false);
            const button = this.host.nativeElement.querySelector<HTMLElement>('.app-tabs-more-btn');
            button?.focus();
        }
    }

    onKey(event: KeyboardEvent): void {
        const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
        if (!keys.includes(event.key)) {
            return;
        }
        event.preventDefault();

        const selectable = this.visibleTabs().filter(tab => !tab.disabled);
        if (!selectable.length) {
            return;
        }
        const currentIndex = selectable.findIndex(tab => tab.key === this.active());

        let nextIndex: number;
        switch (event.key) {
            case 'Home':
                nextIndex = 0;
                break;
            case 'End':
                nextIndex = selectable.length - 1;
                break;
            case 'ArrowLeft':
                nextIndex = (currentIndex - 1 + selectable.length) % selectable.length;
                break;
            default:
                nextIndex = (currentIndex + 1) % selectable.length;
        }

        const next = selectable[nextIndex];
        this.active.set(next.key);
        this.menuOpen.set(false);
        this.focusTab(next.key);
    }

    private focusTab(key: string): void {
        afterNextRender(() => {
            const list = this.listRef()?.nativeElement;
            const button = list?.querySelector<HTMLElement>(`#tab-${CSS.escape(key)}`);
            button?.focus();
        }, {injector: this.injector});
    }

    private observeResize(): void {
        const list = this.listRef()?.nativeElement;
        if (!list || typeof ResizeObserver === 'undefined') {
            return;
        }
        this.zone.runOutsideAngular(() => {
            const observer = new ResizeObserver(() => this.scheduleFit());
            observer.observe(list);
            this.destroyRef.onDestroy(() => observer.disconnect());
        });
    }

    private fitScheduled = false;

    private scheduleFit(): void {
        if (this.fitScheduled || typeof requestAnimationFrame === 'undefined') {
            return;
        }
        this.fitScheduled = true;
        this.zone.runOutsideAngular(() => {
            requestAnimationFrame(() => {
                this.fitScheduled = false;
                this.fit();
            });
        });
    }

    /** Algorithme « priority+ » sur le DOM réel (jamais sur des largeurs estimées). */
    private fit(): void {
        const list = this.listRef()?.nativeElement;
        if (!list) {
            return;
        }
        const moreWrap = list.querySelector<HTMLElement>('.app-tabs-more');
        const buttons = Array.from(list.querySelectorAll<HTMLElement>('.app-tab'));
        const activeKey = this.active();
        const fits = () => list.scrollWidth <= list.clientWidth + 1;
        const setHidden = (el: HTMLElement | null, hide: boolean) => {
            if (el) {
                el.style.display = hide ? 'none' : '';
            }
        };

        // 1. Tout afficher, masquer « Plus ».
        buttons.forEach(button => setHidden(button, false));
        setHidden(moreWrap, true);

        const hidden = new Set<string>();

        if (!fits()) {
            // 2. Afficher « Plus » (avec son badge courant).
            setHidden(moreWrap, false);

            // 3. Masquer depuis la fin, un par un, sans masquer l'onglet actif.
            for (let i = buttons.length - 1; i >= 0 && !fits(); i--) {
                const key = buttons[i].dataset.tabKey;
                if (!key || key === activeKey) {
                    continue;
                }
                setHidden(buttons[i], true);
                hidden.add(key);
            }

            // 4. Seconde passe : réafficher dans l'ordre tant que ça tient.
            for (const button of buttons) {
                const key = button.dataset.tabKey;
                if (!key || !hidden.has(key)) {
                    continue;
                }
                setHidden(button, false);
                if (!fits()) {
                    setHidden(button, true);
                    break;
                }
                hidden.delete(key);
            }

            if (!hidden.size) {
                setHidden(moreWrap, true);
            }
        }

        // Nettoyage des styles inline : le signal pilote [hidden] via le template.
        buttons.forEach(button => (button.style.display = ''));
        if (moreWrap) {
            moreWrap.style.display = '';
        }

        if (!this.sameSet(hidden, this.overflowKeys())) {
            this.zone.run(() => this.overflowKeys.set(hidden));
        }
    }

    private sameSet(a: Set<string>, b: Set<string>): boolean {
        if (a.size !== b.size) {
            return false;
        }
        for (const value of a) {
            if (!b.has(value)) {
                return false;
            }
        }

        return true;
    }
}
