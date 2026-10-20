import {Directive, effect, ElementRef, HostListener, inject, input, OnDestroy, Renderer2} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

import {Talk} from '../talks-planning-model';

/**
 * Étiquette qui suit le curseur quand une intervention est « en main ».
 * Appliquée sur la page : elle crée son élément dans le document et le déplace au pointeur.
 */
@Directive({
               selector: '[talkInHandGhost]',
               standalone: true
           })
export class TalkInHandDirective implements OnDestroy {
    readonly talkInHandGhost = input<Talk | null>(null);

    private readonly renderer = inject(Renderer2);
    private readonly host = inject(ElementRef);
    private readonly translate = inject(TranslateService);
    private ghost: HTMLElement | null = null;

    constructor() {
        effect(() => {
            const talk = this.talkInHandGhost();
            if (!talk) {
                this.destroyGhost();
                return;
            }
            const ghost = this.ensureGhost();
            ghost.innerHTML = '';
            ghost.style.borderLeftColor = talk.type === 'CONFERENCE'
                                          ? 'var(--tp-conference, #7c5cff)'
                                          : 'var(--tp-workshop, #16a3a3)';
            ghost.appendChild(this.line('b', talk.title));
            ghost.appendChild(this.line('small', `${talk.participation.therapistName} · ${this.durations(talk)}`));
            ghost.appendChild(this.line('small', this.translateText('planningTalks.inHand.ghost')));
        });
    }

    @HostListener('document:pointermove', ['$event'])
    onPointerMove(event: PointerEvent): void {
        const ghost = this.ghost;
        if (!ghost) {
            return;
        }
        const x = Math.min(event.clientX + 16, window.innerWidth - ghost.offsetWidth - 8);
        const y = Math.min(event.clientY + 16, window.innerHeight - ghost.offsetHeight - 8);
        ghost.style.transform = `translate(${x}px, ${y}px)`;
    }

    ngOnDestroy(): void {
        this.destroyGhost();
    }

    private durations(talk: Talk): string {
        return this.translateText('planningTalks.durations.short', {
            prep: talk.preparationMinutes,
            dur: talk.durationTalkMinutes,
            clean: talk.cleanupMinutes
        });
    }

    private translateText(key: string, params?: Record<string, string | number>): string {
        return String(this.translate.instant(key, params));
    }

    private line(tag: string, text: string): HTMLElement {
        const element = this.renderer.createElement(tag) as HTMLElement;
        element.textContent = text;
        element.style.display = 'block';
        return element;
    }

    private ensureGhost(): HTMLElement {
        if (!this.ghost) {
            const ghost = this.renderer.createElement('div') as HTMLElement;
            Object.assign(ghost.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                zIndex: '2000',
                pointerEvents: 'none',
                maxWidth: '220px',
                padding: '6px 10px',
                borderRadius: '8px',
                borderLeft: '3px solid var(--tp-accent, #325d88)',
                background: 'var(--app-surface, #fff)',
                color: 'var(--app-text, #575757)',
                fontSize: '11px',
                boxShadow: '0 6px 20px rgba(0,0,0,.18)'
            } as Partial<CSSStyleDeclaration>);
            this.renderer.appendChild(this.host.nativeElement.ownerDocument.body, ghost);
            this.ghost = ghost;
        }
        return this.ghost;
    }

    private destroyGhost(): void {
        if (this.ghost?.parentNode) {
            this.ghost.parentNode.removeChild(this.ghost);
        }
        this.ghost = null;
    }
}
