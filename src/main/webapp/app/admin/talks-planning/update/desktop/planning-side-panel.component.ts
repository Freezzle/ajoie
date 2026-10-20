import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';

/** Panneau de droite repliable (§5.3 / §5.4). Le contenu est projeté par la page. */
@Component({
               selector: 'planning-side-panel',
               standalone: true,
               imports: [TranslatePipe],
               template: `
                   @if (folded()) {
                       <button type="button"
                               class="btn btn-outline-secondary w-100 h-100 d-flex flex-column align-items-center gap-2 py-2 px-1"
                               (click)="foldToggled.emit()">
                           <i class="pi pi-angle-left"></i>
                           <span class="tp-folded-label small">
                               {{ 'planningTalks.tray.title' | translate }} {{ count() }}
                           </span>
                       </button>
                   } @else {
                       <div class="card tp-panel">
                           <div class="card-header d-flex justify-content-between align-items-start gap-2 py-2">
                               <div class="d-flex flex-column min-w-0">
                                   <span class="fw-semibold text-truncate">{{ title() }}</span>
                                   @if (subtitle()) {
                                       <span class="small text-muted">{{ subtitle() }}</span>
                                   }
                               </div>
                               @if (closable()) {
                                   <button type="button"
                                           class="btn btn-sm btn-link text-muted p-0"
                                           (click)="closeRequested.emit()">
                                       <i class="pi pi-times"></i>
                                   </button>
                               } @else {
                                   <button type="button"
                                           class="btn btn-sm btn-link text-muted p-0"
                                           (click)="foldToggled.emit()">
                                       <i class="pi pi-angle-right"></i>
                                   </button>
                               }
                           </div>
                           <div class="card-body overflow-auto d-flex flex-column p-2">
                               <ng-content/>
                           </div>
                       </div>
                   }
               `,
               styleUrl: './planning-side-panel.component.scss',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class PlanningSidePanelComponent {
    readonly folded = input<boolean>(false);
    readonly title = input<string>('');
    readonly subtitle = input<string>('');
    readonly count = input<number>(0);
    readonly closable = input<boolean>(false);

    readonly foldToggled = output<void>();
    readonly closeRequested = output<void>();
}
