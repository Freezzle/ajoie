import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { Square } from './planning.model';
import { Line } from './line.model';
import dayjs from 'dayjs/esm';
import { Dayjs } from 'dayjs';

@Component({
  imports: [DatePipe, FaIconComponent, CommonModule],
  selector: 'daily-planning',
  standalone: true,
  styleUrl: './daily-planning.component.scss',
  templateUrl: './daily-planning.component.html',
})
export class DailyPlanningComponent implements OnInit {
  @Input() day: Dayjs = dayjs();
  @Input() title: string = 'Planning';
  @Input() columnNames: string[] = [];
  @Input() lines: Line[] = [];
  @Input() types: string[] = [];
  @Input() intervalHour: number = 1;
  colors: string[] = ['event-first', 'event-second', 'event-third', 'event-fourth', 'event-fifth', 'event-sixth'];
  editingLines: Line[] = [];
  @Output() finalLines = new EventEmitter<Line[]>();
  readMode: boolean = true;

  constructor() {}

  ngOnInit() {
    this.init();
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

  protected init() {
    if (!this.columnNames.length) {
      this.columnNames = Array.from({ length: 10 / this.intervalHour }, (_, i) => 9 + i + 'h');
    }

    if (!this.types.length) {
      this.types = ['-'];
    } else if (this.types.length > this.colors.length) {
      throw new Error('Reach out the size of' + this.colors.length + ' maximum types.');
    }

    this.editingLines = [];
    this.lines.forEach(line => {
      const newLine = {
        label: line.label,
        squares: [],
        unusableColumns: line.unusableColumns,
      } as Line;

      this.editingLines.push(newLine);

      for (let i = 0; i < this.columnNames.length; i++) {
        const squareFound = line.squares.find(square => square.column === i);
        if (!squareFound) {
          const emptySquare: Square = {
            column: i,
            type: this.types[0],
            usable: !line.unusableColumns.includes(i),
            used: false,
          };

          newLine.squares.push(emptySquare);
        } else {
          const newSquare: Square = {
            column: squareFound.column,
            type: squareFound.type,
            usable: squareFound.usable,
            used: squareFound.used,
          };
          newLine.squares.push(newSquare);
        }
      }
    });
  }
}
