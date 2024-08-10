import { Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { DurationPipe, FormatMediumDatetimePipe, FormatMediumDatePipe } from 'app/shared/date';
import { ISalon } from '../salon.model';

@Component({
  standalone: true,
  selector: 'jhi-salon-stats',
  templateUrl: './salon-detail.component.html',
  imports: [SharedModule, RouterModule, DurationPipe, FormatMediumDatetimePipe, FormatMediumDatePipe],
})
export class SalonDetailComponent {
  salon = input<ISalon | null>(null);

  previousState(): void {
    window.history.back();
  }
}
