import {Directive} from '@angular/core';

@Directive({
               selector: '[appDetailStatus]',
               standalone: true
           })
export class DetailStatusDirective {
}

@Directive({
               selector: '[appDetailMain]',
               standalone: true
           })
export class DetailMainDirective {
}

@Directive({
               selector: '[appDetailSide]',
               standalone: true
           })
export class DetailSideDirective {
}

@Directive({
               selector: '[appDetailCreateActions]',
               standalone: true
           })
export class DetailCreateActionsDirective {
}
