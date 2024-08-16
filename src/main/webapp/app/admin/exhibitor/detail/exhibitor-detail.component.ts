import { Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { DurationPipe, FormatMediumDatePipe, FormatMediumDatetimePipe } from 'app/shared/date';
import {IExhibitor}from '../exhibitor.model';

@Component({
  standalone: true,
selector: 'jhi-exhibitor-stats',
templateUrl: './exhibitor-detail.component.html',
  imports: [SharedModule, RouterModule, DurationPipe, FormatMediumDatetimePipe, FormatMediumDatePipe],
})
export class ExhibitorDetailComponent {
exhibitor = input<IExhibitor | null>(null);

  previousState(): void {
    window.history.back();
  }
}
