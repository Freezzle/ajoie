import {ChangeDetectionStrategy, Component, contentChildren, input} from '@angular/core';

import {
    DetailSideDirective
} from './detail-page-layout-slots.directive';

@Component({
               selector: 'app-detail-page-layout',
               standalone: true,
               imports: [],
               templateUrl: './detail-page-layout.component.html',
               styleUrl: './detail-page-layout.component.scss',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class DetailPageLayoutComponent {
    readonly singleColumn = input(false);
    readonly sides = contentChildren(DetailSideDirective);
}
