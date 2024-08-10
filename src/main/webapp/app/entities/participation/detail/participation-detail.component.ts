import { Component, inject, input } from '@angular/core';
import { RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { DurationPipe, FormatMediumDatetimePipe, FormatMediumDatePipe } from 'app/shared/date';
import { IParticipation } from '../participation.model';
import { ParticipationService } from '../service/participation.service';

@Component({
  standalone: true,
  selector: 'jhi-participation-stats',
  templateUrl: './participation-detail.component.html',
  imports: [SharedModule, RouterModule, DurationPipe, FormatMediumDatetimePipe, FormatMediumDatePipe],
})
export class ParticipationDetailComponent {
  participation = input<IParticipation | null>(null);

  protected participationService = inject(ParticipationService);
  previousState(): void {
    window.history.back();
  }

  generate(): void {
    this.participationService.generateInvoices(this.participation()!.id).subscribe();
  }
}
