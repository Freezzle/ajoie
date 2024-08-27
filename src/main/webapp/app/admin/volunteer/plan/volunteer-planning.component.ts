import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { DailyPlanningComponent } from '../../../shared/daily-planning/daily-planning.component';
import { Line } from '../../../shared/daily-planning/line.model';

@Component({
  standalone: true,
  selector: 'jhi-volunteer-planning',
  templateUrl: './volunteer-planning.component.html',
  imports: [DatePipe, FaIconComponent, DailyPlanningComponent],
})
export class VolunteerPlanningComponent implements OnInit {
  constructor() {}

  ngOnInit() {}

  getLines(): Line[] {
    return [
      {
        label: 'Dylan',
        plannings: [],
      },
      {
        label: 'Melanie',
        plannings: [],
      },
    ];
  }
}
