import { Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { DurationPipe, FormatMediumDatetimePipe, FormatMediumDatePipe } from 'app/shared/date';
import { IDimensionStand } from '../dimension-stand.model';

@Component({
  standalone: true,
  selector: 'jhi-dimension-stand-detail',
  templateUrl: './dimension-stand-detail.component.html',
  imports: [SharedModule, RouterModule, DurationPipe, FormatMediumDatetimePipe, FormatMediumDatePipe],
})
export class DimensionStandDetailComponent {
  dimensionStand = input<IDimensionStand | null>(null);

  previousState(): void {
    window.history.back();
  }
}
