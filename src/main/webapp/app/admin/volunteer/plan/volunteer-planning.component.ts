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
        squares: [],
        unusableHours: [],
      },
      {
        label: 'Charlène',
        squares: [],
        unusableHours: [],
      },
      {
        label: 'Davy',
        squares: [],
        unusableHours: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
      },
      {
        label: 'Mélanie',
        squares: [],
        unusableHours: [11, 12, 13, 14, 15],
      },
      {
        label: 'Mathias',
        squares: [],
        unusableHours: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
      },
      {
        label: 'Anaïs',
        squares: [],
        unusableHours: [8, 9, 10],
      },
    ];
  }
}
