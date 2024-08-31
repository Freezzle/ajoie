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

  dbLinesFirstDay: Line[] = [];
  dbLinesSecondDay: Line[] = [];

  ngOnInit() {
    this.dbLinesFirstDay = this.initLines();
    this.dbLinesSecondDay = this.initLines();
  }

  saveLinesFirstDay(lines: Line[]): void {
    console.log(lines);
    this.dbLinesFirstDay = lines;
  }

  saveLinesSecondDay(lines: Line[]): void {
    console.log(lines);
    this.dbLinesSecondDay = lines;
  }

  giveLinesFirstDay(): Line[] {
    return this.dbLinesFirstDay;
  }

  giveLinesSecondDay(): Line[] {
    return this.dbLinesSecondDay;
  }

  initLines(): Line[] {
    return [
      {
        label: 'Béatrice',
        squares: [{ column: 3, type: 'Buvette', usable: true, used: true }],
        unusableColumns: [0, 1, 2, 6, 7],
      },
      {
        label: 'Mélanie',
        squares: [],
        unusableColumns: [],
      },
      {
        label: 'Charlène',
        squares: [{ column: 6, type: 'Vaisselle', usable: true, used: true }],
        unusableColumns: [],
      },
      {
        label: 'Raphael',
        squares: [],
        unusableColumns: [],
      },
      {
        label: 'Maeva',
        squares: [],
        unusableColumns: [],
      },
      {
        label: 'Dylan',
        squares: [],
        unusableColumns: [],
      },
      {
        label: 'Jeanine',
        squares: [],
        unusableColumns: [],
      },
      {
        label: 'Mickael',
        squares: [],
        unusableColumns: [],
      },
      {
        label: 'Anais',
        squares: [],
        unusableColumns: [],
      },
      {
        label: 'Pascal',
        squares: [],
        unusableColumns: [],
      },
      {
        label: 'Esma',
        squares: [],
        unusableColumns: [],
      },
      {
        label: 'François',
        squares: [],
        unusableColumns: [],
      },
      {
        label: 'Leila',
        squares: [],
        unusableColumns: [],
      },
      {
        label: 'Yagmur',
        squares: [],
        unusableColumns: [],
      },
      {
        label: 'Dina',
        squares: [],
        unusableColumns: [],
      },
      {
        label: 'Laurine',
        squares: [],
        unusableColumns: [],
      },
    ];
  }
}
