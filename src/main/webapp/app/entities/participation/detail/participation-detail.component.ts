import { Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { DurationPipe, FormatMediumDatetimePipe, FormatMediumDatePipe } from 'app/shared/date';
import { IParticipation } from '../participation.model';

@Component({
  standalone: true,
  selector: 'jhi-participation-detail',
  templateUrl: './participation-detail.component.html',
  imports: [SharedModule, RouterModule, DurationPipe, FormatMediumDatetimePipe, FormatMediumDatePipe],
})
export class ParticipationDetailComponent {
  participation = input<IParticipation | null>(null);

  previousState(): void {
    window.history.back();
  }
}
