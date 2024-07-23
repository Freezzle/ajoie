import { Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { DurationPipe, FormatMediumDatetimePipe, FormatMediumDatePipe } from 'app/shared/date';
import { IStand } from '../stand.model';

@Component({
  standalone: true,
  selector: 'jhi-stand-detail',
  templateUrl: './stand-detail.component.html',
  imports: [SharedModule, RouterModule, DurationPipe, FormatMediumDatetimePipe, FormatMediumDatePipe],
})
export class StandDetailComponent {
  stand = input<IStand | null>(null);

  previousState(): void {
    window.history.back();
  }
}
