import { Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { DurationPipe, FormatMediumDatetimePipe, FormatMediumDatePipe } from 'app/shared/date';
import { IConfigurationSalon } from '../configuration-salon.model';

@Component({
  standalone: true,
  selector: 'jhi-configuration-salon-detail',
  templateUrl: './configuration-salon-detail.component.html',
  imports: [SharedModule, RouterModule, DurationPipe, FormatMediumDatetimePipe, FormatMediumDatePipe],
})
export class ConfigurationSalonDetailComponent {
  configurationSalon = input<IConfigurationSalon | null>(null);

  previousState(): void {
    window.history.back();
  }
}
