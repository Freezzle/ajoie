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
        label: 'Béatrice',
        squares: [],
        unusableHours: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 16, 17, 18, 19, 20, 21],
      },
      {
        label: 'Mélanie',
        squares: [
          {
            startHour: 9,
            type: 'Vaisselle',
            used: true,
            usable: true,
          },
        ],
        unusableHours: [],
      },
      {
        label: 'Charlène',
        squares: [],
        unusableHours: [],
      },
      {
        label: 'Raphael',
        squares: [],
        unusableHours: [],
      },
      {
        label: 'Maeva',
        squares: [],
        unusableHours: [],
      },
      {
        label: 'Dylan',
        squares: [],
        unusableHours: [],
      },
      {
        label: 'Jeanine',
        squares: [],
        unusableHours: [],
      },
      {
        label: 'Mickael',
        squares: [],
        unusableHours: [],
      },
      {
        label: 'Anais',
        squares: [],
        unusableHours: [],
      },
      {
        label: 'Pascal',
        squares: [],
        unusableHours: [],
      },
      {
        label: 'Esma',
        squares: [],
        unusableHours: [],
      },
      {
        label: 'François',
        squares: [],
        unusableHours: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      },
      {
        label: 'Leila',
        squares: [],
        unusableHours: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
      },
      {
        label: 'Yagmur',
        squares: [],
        unusableHours: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
      },
      {
        label: 'Dina',
        squares: [],
        unusableHours: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 14, 15, 16, 17, 18, 19, 20, 21],
      },
      {
        label: 'Laurine',
        squares: [],
        unusableHours: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
      },
    ];
  }
}
