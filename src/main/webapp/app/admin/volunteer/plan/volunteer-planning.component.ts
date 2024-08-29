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

  dbLines: Line[] = [];

  ngOnInit() {
    this.dbLines = this.initLines();
  }

  saveLines(lines: Line[]): void {
    console.log(lines);
    this.dbLines = lines;
  }

  giveLines(): Line[] {
    return this.dbLines;
  }

  initLines(): Line[] {
    return [
      {
        label: 'Béatrice',
        squares: [
          {
            startHour: 9,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 10,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 11,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 12,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 13,
            type: 'Vaisselle',
            usable: true,
            used: true,
          },
          {
            startHour: 14,
            type: 'Vaisselle',
            usable: true,
            used: true,
          },
          {
            startHour: 15,
            type: 'Vaisselle',
            usable: true,
            used: true,
          },
          {
            startHour: 16,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 17,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 18,
            type: 'Buvette',
            usable: false,
            used: false,
          },
        ],
        unusableHours: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 16, 17, 18, 19, 20, 21],
      },
      {
        label: 'Mélanie',
        squares: [
          {
            startHour: 9,
            type: 'Buvette',
            used: true,
            usable: true,
          },
          {
            startHour: 10,
            type: 'Buvette',
            usable: true,
            used: true,
          },
          {
            startHour: 11,
            type: 'Buvette',
            usable: true,
            used: true,
          },
          {
            startHour: 12,
            type: 'Buvette',
            usable: true,
            used: true,
          },
          {
            startHour: 13,
            type: 'Buvette',
            usable: true,
            used: true,
          },
          {
            startHour: 14,
            type: 'Libre',
            usable: true,
            used: true,
          },
          {
            startHour: 15,
            type: 'Libre',
            usable: true,
            used: true,
          },
          {
            startHour: 16,
            type: 'Buvette',
            usable: true,
            used: true,
          },
          {
            startHour: 17,
            type: 'Buvette',
            usable: true,
            used: true,
          },
          {
            startHour: 18,
            type: 'Buvette',
            usable: true,
            used: true,
          },
        ],
        unusableHours: [],
      },
      {
        label: 'Charlène',
        squares: [
          {
            startHour: 9,
            type: 'Libre',
            usable: true,
            used: true,
          },
          {
            startHour: 10,
            type: 'Libre',
            usable: true,
            used: true,
          },
          {
            startHour: 11,
            type: 'Buvette',
            usable: true,
            used: true,
          },
          {
            startHour: 12,
            type: 'Buvette',
            usable: true,
            used: true,
          },
          {
            startHour: 13,
            type: 'Buvette',
            usable: true,
            used: true,
          },
          {
            startHour: 14,
            type: 'Libre',
            usable: true,
            used: true,
          },
          {
            startHour: 15,
            type: 'Libre',
            usable: true,
            used: true,
          },
          {
            startHour: 16,
            type: 'Buvette',
            usable: true,
            used: true,
          },
          {
            startHour: 17,
            type: 'Buvette',
            usable: true,
            used: true,
          },
          {
            startHour: 18,
            type: 'Buvette',
            usable: true,
            used: true,
          },
        ],
        unusableHours: [],
      },
      {
        label: 'Raphael',
        squares: [
          {
            startHour: 9,
            type: 'Libre',
            usable: true,
            used: true,
          },
          {
            startHour: 10,
            type: 'Libre',
            usable: true,
            used: true,
          },
          {
            startHour: 11,
            type: 'Cuisine',
            usable: true,
            used: true,
          },
          {
            startHour: 12,
            type: 'Cuisine',
            usable: true,
            used: true,
          },
          {
            startHour: 13,
            type: 'Cuisine',
            usable: true,
            used: true,
          },
          {
            startHour: 14,
            type: 'Buvette',
            usable: true,
            used: true,
          },
          {
            startHour: 15,
            type: 'Buvette',
            usable: true,
            used: true,
          },
          {
            startHour: 16,
            type: 'Libre',
            usable: true,
            used: true,
          },
          {
            startHour: 17,
            type: 'Libre',
            usable: true,
            used: true,
          },
          {
            startHour: 18,
            type: 'Libre',
            usable: true,
            used: true,
          },
        ],
        unusableHours: [],
      },
      {
        label: 'Maeva',
        squares: [
          {
            startHour: 9,
            type: 'Vaisselle',
            usable: true,
            used: true,
          },
          {
            startHour: 10,
            type: 'Vaisselle',
            usable: true,
            used: true,
          },
          {
            startHour: 11,
            type: 'Libre',
            usable: true,
            used: true,
          },
          {
            startHour: 12,
            type: 'Libre',
            usable: true,
            used: true,
          },
          {
            startHour: 13,
            type: 'Libre',
            usable: true,
            used: true,
          },
          {
            startHour: 14,
            type: 'Buvette',
            usable: true,
            used: true,
          },
          {
            startHour: 15,
            type: 'Buvette',
            usable: true,
            used: true,
          },
          {
            startHour: 16,
            type: 'Libre',
            usable: true,
            used: true,
          },
          {
            startHour: 17,
            type: 'Libre',
            usable: true,
            used: true,
          },
          {
            startHour: 18,
            type: 'Libre',
            usable: true,
            used: true,
          },
        ],
        unusableHours: [],
      },
      {
        label: 'Dylan',
        squares: [
          {
            startHour: 9,
            type: 'Buvette',
            usable: true,
            used: true,
          },
          {
            startHour: 10,
            type: 'Buvette',
            usable: true,
            used: true,
          },
          {
            startHour: 11,
            type: 'Buvette',
            usable: true,
            used: true,
          },
          {
            startHour: 12,
            type: 'Buvette',
            usable: true,
            used: true,
          },
          {
            startHour: 13,
            type: 'Buvette',
            usable: true,
            used: true,
          },
          {
            startHour: 14,
            type: 'Libre',
            usable: true,
            used: true,
          },
          {
            startHour: 15,
            type: 'Libre',
            usable: true,
            used: true,
          },
          {
            startHour: 16,
            type: 'Buvette',
            usable: true,
            used: true,
          },
          {
            startHour: 17,
            type: 'Buvette',
            usable: true,
            used: true,
          },
          {
            startHour: 18,
            type: 'Buvette',
            usable: true,
            used: true,
          },
        ],
        unusableHours: [],
      },
      {
        label: 'Jeanine',
        squares: [
          {
            startHour: 9,
            type: 'Cuisine',
            usable: true,
            used: true,
          },
          {
            startHour: 10,
            type: 'Cuisine',
            usable: true,
            used: true,
          },
          {
            startHour: 11,
            type: 'Cuisine',
            usable: true,
            used: true,
          },
          {
            startHour: 12,
            type: 'Cuisine',
            usable: true,
            used: true,
          },
          {
            startHour: 13,
            type: 'Cuisine',
            usable: true,
            used: true,
          },
          {
            startHour: 14,
            type: 'Vaisselle',
            usable: true,
            used: true,
          },
          {
            startHour: 15,
            type: 'Vaisselle',
            usable: true,
            used: true,
          },
          {
            startHour: 16,
            type: 'Libre',
            usable: true,
            used: true,
          },
          {
            startHour: 17,
            type: 'Libre',
            usable: true,
            used: true,
          },
          {
            startHour: 18,
            type: 'Libre',
            usable: true,
            used: true,
          },
        ],
        unusableHours: [],
      },
      {
        label: 'Mickael',
        squares: [
          {
            startHour: 9,
            type: 'Vaisselle',
            usable: true,
            used: true,
          },
          {
            startHour: 10,
            type: 'Vaisselle',
            usable: true,
            used: true,
          },
          {
            startHour: 11,
            type: 'Cuisine',
            usable: true,
            used: true,
          },
          {
            startHour: 12,
            type: 'Cuisine',
            usable: true,
            used: true,
          },
          {
            startHour: 13,
            type: 'Cuisine',
            usable: true,
            used: true,
          },
          {
            startHour: 14,
            type: 'Libre',
            usable: true,
            used: true,
          },
          {
            startHour: 15,
            type: 'Libre',
            usable: true,
            used: true,
          },
          {
            startHour: 16,
            type: 'Vaisselle',
            usable: true,
            used: true,
          },
          {
            startHour: 17,
            type: 'Vaisselle',
            usable: true,
            used: true,
          },
          {
            startHour: 18,
            type: 'Vaisselle',
            usable: true,
            used: true,
          },
        ],
        unusableHours: [],
      },
      {
        label: 'Anais',
        squares: [
          {
            startHour: 9,
            type: 'Buvette',
            usable: true,
            used: false,
          },
          {
            startHour: 10,
            type: 'Buvette',
            usable: true,
            used: false,
          },
          {
            startHour: 11,
            type: 'Vaisselle',
            usable: true,
            used: true,
          },
          {
            startHour: 12,
            type: 'Vaisselle',
            usable: true,
            used: true,
          },
          {
            startHour: 13,
            type: 'Vaisselle',
            usable: true,
            used: true,
          },
          {
            startHour: 14,
            type: 'Libre',
            usable: true,
            used: true,
          },
          {
            startHour: 15,
            type: 'Libre',
            usable: true,
            used: true,
          },
          {
            startHour: 16,
            type: 'Vaisselle',
            usable: true,
            used: true,
          },
          {
            startHour: 17,
            type: 'Vaisselle',
            usable: true,
            used: true,
          },
          {
            startHour: 18,
            type: 'Vaisselle',
            usable: true,
            used: true,
          },
        ],
        unusableHours: [],
      },
      {
        label: 'Pascal',
        squares: [
          {
            startHour: 9,
            type: 'Libre',
            usable: true,
            used: true,
          },
          {
            startHour: 10,
            type: 'Libre',
            usable: true,
            used: true,
          },
          {
            startHour: 11,
            type: 'Cuisine',
            usable: true,
            used: true,
          },
          {
            startHour: 12,
            type: 'Cuisine',
            usable: true,
            used: true,
          },
          {
            startHour: 13,
            type: 'Cuisine',
            usable: true,
            used: true,
          },
          {
            startHour: 14,
            type: 'Libre',
            usable: true,
            used: true,
          },
          {
            startHour: 15,
            type: 'Libre',
            usable: true,
            used: true,
          },
          {
            startHour: 16,
            type: 'Libre',
            usable: true,
            used: true,
          },
          {
            startHour: 17,
            type: 'Libre',
            usable: true,
            used: true,
          },
          {
            startHour: 18,
            type: 'Libre',
            usable: true,
            used: true,
          },
        ],
        unusableHours: [],
      },
      {
        label: 'Esma',
        squares: [
          {
            startHour: 9,
            type: 'Cuisine',
            usable: true,
            used: true,
          },
          {
            startHour: 10,
            type: 'Cuisine',
            usable: true,
            used: true,
          },
          {
            startHour: 11,
            type: 'Cuisine',
            usable: true,
            used: true,
          },
          {
            startHour: 12,
            type: 'Cuisine',
            usable: true,
            used: true,
          },
          {
            startHour: 13,
            type: 'Cuisine',
            usable: true,
            used: true,
          },
          {
            startHour: 14,
            type: 'Buvette',
            usable: true,
            used: false,
          },
          {
            startHour: 15,
            type: 'Buvette',
            usable: true,
            used: false,
          },
          {
            startHour: 16,
            type: 'Buvette',
            usable: true,
            used: false,
          },
          {
            startHour: 17,
            type: 'Buvette',
            usable: true,
            used: false,
          },
          {
            startHour: 18,
            type: 'Buvette',
            usable: true,
            used: false,
          },
        ],
        unusableHours: [],
      },
      {
        label: 'François',
        squares: [
          {
            startHour: 9,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 10,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 11,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 12,
            type: 'Cuisine',
            usable: true,
            used: true,
          },
          {
            startHour: 13,
            type: 'Cuisine',
            usable: true,
            used: true,
          },
          {
            startHour: 14,
            type: 'Buvette',
            usable: true,
            used: false,
          },
          {
            startHour: 15,
            type: 'Buvette',
            usable: true,
            used: false,
          },
          {
            startHour: 16,
            type: 'Buvette',
            usable: true,
            used: false,
          },
          {
            startHour: 17,
            type: 'Buvette',
            usable: true,
            used: false,
          },
          {
            startHour: 18,
            type: 'Buvette',
            usable: true,
            used: false,
          },
        ],
        unusableHours: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      },
      {
        label: 'Leila',
        squares: [
          {
            startHour: 9,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 10,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 11,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 12,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 13,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 14,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 15,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 16,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 17,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 18,
            type: 'Buvette',
            usable: false,
            used: false,
          },
        ],
        unusableHours: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
      },
      {
        label: 'Yagmur',
        squares: [
          {
            startHour: 9,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 10,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 11,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 12,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 13,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 14,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 15,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 16,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 17,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 18,
            type: 'Buvette',
            usable: false,
            used: false,
          },
        ],
        unusableHours: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
      },
      {
        label: 'Dina',
        squares: [
          {
            startHour: 9,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 10,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 11,
            type: 'Cuisine',
            usable: true,
            used: true,
          },
          {
            startHour: 12,
            type: 'Cuisine',
            usable: true,
            used: true,
          },
          {
            startHour: 13,
            type: 'Cuisine',
            usable: true,
            used: true,
          },
          {
            startHour: 14,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 15,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 16,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 17,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 18,
            type: 'Buvette',
            usable: false,
            used: false,
          },
        ],
        unusableHours: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 14, 15, 16, 17, 18, 19, 20, 21],
      },
      {
        label: 'Laurine',
        squares: [
          {
            startHour: 9,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 10,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 11,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 12,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 13,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 14,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 15,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 16,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 17,
            type: 'Buvette',
            usable: false,
            used: false,
          },
          {
            startHour: 18,
            type: 'Buvette',
            usable: false,
            used: false,
          },
        ],
        unusableHours: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
      },
    ];
  }
}
