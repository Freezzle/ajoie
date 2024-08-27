import { Component, Input, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { Planning } from './planning.model';
import { Line } from './line.model';
import dayjs from 'dayjs/esm';

@Component({
  imports: [DatePipe, FaIconComponent],
  selector: 'daily-planning',
  standalone: true,
  styleUrl: './daily-planning.component.scss',
  templateUrl: './daily-planning.component.html',
})
export class DailyPlanningComponent implements OnInit {
  @Input() hours: Date[] = [];
  @Input() lines: Line[] = [];
  @Input() types: string[] = [];
  colors: string[] = ['event-blue', 'event-green', 'event-orange', 'event-red', 'event-grey'];
  editingLines: Line[] = [];

  constructor() {}

  ngOnInit() {
    if (!this.hours.length) {
      const now = dayjs();
      this.hours = Array.from({ length: 8 }, (_, i) => new Date(now.year(), now.month() + 1, now.day() + 1, 8 + i, 0));
    }

    if (!this.types.length) {
      this.types = ['normal'];
    }

    this.lines.forEach(line => {
      this.editingLines.push(line);
    });
  }

  isEventAtHour(line: Line, hour: Date): Planning | undefined {
    return line.plannings.find(planning => planning.startHour === hour.getHours());
  }

  editEvent(planningToEdit: Planning): void {
    const index = this.types.indexOf(planningToEdit.type);

    if (index + 1 === this.types.length) {
      planningToEdit.type = this.types[0];
    } else {
      planningToEdit.type = this.types[index + 1];
    }
  }

  removeEvent(line: Line, planningToRemove: Planning): void {
    line.plannings = line.plannings.filter(planning => planning !== planningToRemove);
  }

  getColorClass(planning: Planning): string {
    return this.colors[this.types.indexOf(planning.type)];
  }

  addEvent(line: Line, hour: Date): void {
    const newPlanning: Planning = {
      startHour: hour.getHours(),
      endHour: hour.getHours() + 1,
      type: this.types[0],
    };

    line.plannings.push(newPlanning);
  }
}
