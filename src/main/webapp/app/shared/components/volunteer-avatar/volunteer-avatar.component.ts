import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';

import {hueFromId, initials} from '../../../admin/volunteer-planning/components/volunteer-planning-utils';

@Component({
               selector: 'volunteer-avatar',
               standalone: true,
               template: `
                   <span class="vp-av"
                         [class.fx]="focused()"
                         [class.dim]="dimmed()"
                         [style.--h]="hue()"
                         [style.width.px]="size()"
                         [style.height.px]="size()"
                         [style.font-size.px]="fontSize()"
                         [title]="label()">{{ text() }}</span>
               `,
               styles: [`
                   :host {
                       display: inline-flex;
                       flex: none;
                   }

                   .vp-av {
                       display: inline-grid;
                       place-items: center;
                       border-radius: 50%;
                       background: hsl(var(--h) 55% 52%);
                       color: #fff;
                       font-weight: 700;
                       line-height: 1;
                       transition: opacity .15s, transform .15s;
                   }

                   .vp-av.dim {
                       opacity: .18;
                   }

                   .vp-av.fx {
                       opacity: 1;
                       transform: scale(1.1);
                       box-shadow: 0 0 0 2px var(--app-surface), 0 0 0 3.5px var(--app-text);
                   }
               `],
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class VolunteerAvatarComponent {
    readonly volunteerId = input.required<string>();
    readonly label = input<string>('');
    readonly size = input<number>(24);
    readonly focused = input<boolean>(false);
    readonly dimmed = input<boolean>(false);

    readonly hue = computed(() => hueFromId(this.volunteerId()));
    readonly text = computed(() => initials(this.label() || this.volunteerId()));
    readonly fontSize = computed(() => Math.max(8, Math.round(this.size() * 0.4)));
}
