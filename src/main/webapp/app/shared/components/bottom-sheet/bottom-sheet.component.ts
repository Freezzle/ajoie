import {ChangeDetectionStrategy, Component, output} from '@angular/core';

@Component({
               selector: 'bottom-sheet',
               standalone: true,
               template: `
                   <div class="backdrop" (click)="closed.emit()"></div>
                   <div class="sheet">
                       <div class="grab"></div>
                       <ng-content/>
                   </div>
               `,
               styles: [`
                   :host {
                       display: contents;
                   }

                   .backdrop {
                       position: absolute;
                       inset: 0;
                       background: rgba(10, 12, 16, .38);
                       z-index: 40;
                       animation: fade .15s;
                   }

                   .sheet {
                       position: absolute;
                       left: 0;
                       right: 0;
                       bottom: 0;
                       max-height: 80%;
                       background: var(--app-surface);
                       border-radius: 20px 20px 0 0;
                       z-index: 41;
                       display: flex;
                       flex-direction: column;
                       box-shadow: 0 -8px 30px rgba(0, 0, 0, .2);
                       animation: up .2s ease-out;
                       padding-bottom: env(safe-area-inset-bottom);
                   }

                   .grab {
                       width: 40px;
                       height: 4px;
                       border-radius: 2px;
                       background: var(--app-border);
                       margin: 8px auto 0;
                       flex: none;
                   }

                   @keyframes up {
                       from {
                           transform: translateY(40%);
                           opacity: .4;
                       }
                   }

                   @keyframes fade {
                       from {
                           opacity: 0;
                       }
                   }
               `],
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class BottomSheetComponent {
    readonly closed = output<void>();
}
