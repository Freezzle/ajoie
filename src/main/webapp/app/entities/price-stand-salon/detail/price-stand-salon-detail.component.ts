import { Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { DurationPipe, FormatMediumDatetimePipe, FormatMediumDatePipe } from 'app/shared/date';
import { IPriceStandSalon } from '../price-stand-salon.model';

@Component({
  standalone: true,
  selector: 'jhi-price-stand-salon-stats',
  templateUrl: './price-stand-salon-detail.component.html',
  imports: [SharedModule, RouterModule, DurationPipe, FormatMediumDatetimePipe, FormatMediumDatePipe],
})
export class PriceStandSalonDetailComponent {
  priceStandSalon = input<IPriceStandSalon | null>(null);

  previousState(): void {
    window.history.back();
  }
}
