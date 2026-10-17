import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    NgZone,
    OnDestroy,
    Output,
    ViewChild,
    inject
} from '@angular/core';

declare const turnstile: any;

const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

/**
 * Widget Cloudflare Turnstile. Le script n'est chargé que si le captcha est activé côté serveur.
 */
@Component({
               selector: 'app-turnstile-box',
               template: '<div #widget class="turnstile-box"></div>'
           })
export class TurnstileBoxComponent implements AfterViewInit, OnDestroy {
    @Input({required: true}) siteKey!: string;
    @Output() tokenChange = new EventEmitter<string | null>();

    @ViewChild('widget', {static: true}) widget!: ElementRef<HTMLDivElement>;

    private zone = inject(NgZone);
    private widgetId: string | null = null;

    ngAfterViewInit(): void {
        this.loadScript().then(() => this.render()).catch(() => this.tokenChange.emit(null));
    }

    ngOnDestroy(): void {
        if (this.widgetId !== null && typeof turnstile !== 'undefined') {
            turnstile.remove(this.widgetId);
        }
    }

    reset(): void {
        if (this.widgetId !== null && typeof turnstile !== 'undefined') {
            turnstile.reset(this.widgetId);
            this.tokenChange.emit(null);
        }
    }

    private render(): void {
        if (typeof turnstile === 'undefined') {
            return;
        }
        this.widgetId = turnstile.render(this.widget.nativeElement, {
            sitekey: this.siteKey,
            callback: (token: string) => this.zone.run(() => this.tokenChange.emit(token)),
            'expired-callback': () => this.zone.run(() => this.tokenChange.emit(null)),
            'error-callback': () => this.zone.run(() => this.tokenChange.emit(null))
        });
    }

    private loadScript(): Promise<void> {
        if (typeof turnstile !== 'undefined') {
            return Promise.resolve();
        }

        const existing = document.querySelector<HTMLScriptElement>(`script[src="${TURNSTILE_SCRIPT_URL}"]`);
        if (existing) {
            return new Promise<void>((resolve, reject) => {
                existing.addEventListener('load', () => resolve());
                existing.addEventListener('error', () => reject(new Error('turnstile')));
            });
        }

        return new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = TURNSTILE_SCRIPT_URL;
            script.async = true;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('turnstile'));
            document.head.appendChild(script);
        });
    }
}
