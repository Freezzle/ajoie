import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { Square } from './planning.model';
import { Line } from './line.model';
import dayjs from 'dayjs/esm';

@Component({
  imports: [DatePipe, FaIconComponent, CommonModule],
  selector: 'daily-planning',
  standalone: true,
  styleUrl: './daily-planning.component.scss',
  templateUrl: './daily-planning.component.html',
})
export class DailyPlanningComponent implements OnInit {
  @Input() hours: Date[] = [];
  @Input() lines: Line[] = [];
  @Input() types: string[] = [];
  colors: string[] = ['event-green', 'event-orange', 'event-red', 'event-grey', 'event-lightgray', 'event-purple'];
  editingLines: Line[] = [];
  intervalHour: number = 1;
  @Output() finalLines = new EventEmitter<Line[]>();
  readMode: boolean = true;

  constructor() {}

  ngOnInit() {
    this.init();
  }

  protected init() {
    if (!this.hours.length) {
      const now = dayjs();
      this.hours = Array.from({ length: 10 / this.intervalHour }, (_, i) => new Date(now.year(), now.month() + 1, now.day() + 1, 9 + i, 0));
    }

    if (!this.types.length) {
      this.types = ['normal'];
    } else if (this.types.length > this.colors.length) {
      throw new Error('Reach out the size of' + this.colors.length + ' maximum types.');
    }

    this.editingLines = [];
    this.lines.forEach(line => {
      const newLine = {
        label: line.label,
        squares: [],
        unusableHours: line.unusableHours,
      } as Line;

      this.editingLines.push(newLine);

      this.hours.forEach(hour => {
        const squareFound = this.isEventAtHour(line, hour);
        if (!squareFound) {
          const emptySquare: Square = {
            startHour: hour.getHours(),
            type: this.types[0],
            usable: !line.unusableHours.includes(hour.getHours()),
            used: false,
          };

          newLine.squares.push(emptySquare);
        } else {
          newLine.squares.push(squareFound);
        }
      });
    });
  }

  isEventAtHour(line: Line, hour: Date): Square | undefined {
    return line.squares.find(square => square.startHour === hour.getHours());
  }

  addEvent(square: Square): void {
    square.used = true;
    square.type = this.types[0];
  }

  editEvent(squareToEdit: Square): void {
    const index = this.types.indexOf(squareToEdit.type || this.types[0]);

    if (index + 1 === this.types.length) {
      squareToEdit.type = this.types[0];
    } else {
      squareToEdit.type = this.types[index + 1];
    }
  }

  countPerHour(hour: Date, type: string): string {
    let count = 0;
    this.editingLines.forEach(line => {
      let squareFound = this.isEventAtHour(line, hour);
      if (squareFound && squareFound.used && squareFound.type === type) {
        count = count + 1;
      }
    });

    return count > 0 ? '' + count : '-';
  }

  removeEvent(square: Square): void {
    square.used = false;
    square.type = this.types[0];
  }

  getColorClass(type: string): string {
    return this.colors[this.types.indexOf(type)];
  }

  actionOpenEditing(): void {
    this.readMode = false;
  }

  actionCancelEditing(): void {
    this.readMode = true;
    this.init();
  }

  actionEmitAndCloseEditing(): void {
    this.readMode = true;
    this.finalLines.emit(this.editingLines);
  }
}
