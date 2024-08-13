import { Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { DurationPipe, FormatMediumDatePipe, FormatMediumDatetimePipe } from 'app/shared/date';
import { IExponent } from '../exponent.model';

@Component({
  standalone: true,
  selector: 'jhi-exponent-stats',
  templateUrl: './exponent-detail.component.html',
  imports: [SharedModule, RouterModule, DurationPipe, FormatMediumDatetimePipe, FormatMediumDatePipe],
})
export class ExponentDetailComponent {
  exponent = input<IExponent | null>(null);

  previousState(): void {
    window.history.back();
  }
}
