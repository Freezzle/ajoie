import { Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { DurationPipe, FormatMediumDatetimePipe, FormatMediumDatePipe } from 'app/shared/date';
import { IBilling } from '../billing.model';

@Component({
  standalone: true,
  selector: 'jhi-billing-detail',
  templateUrl: './billing-detail.component.html',
  imports: [SharedModule, RouterModule, DurationPipe, FormatMediumDatetimePipe, FormatMediumDatePipe],
})
export class BillingDetailComponent {
  billing = input<IBilling | null>(null);

  previousState(): void {
    window.history.back();
  }
}
