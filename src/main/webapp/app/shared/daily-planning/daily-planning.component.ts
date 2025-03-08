import { Component, Input, OnInit } from '@angular/core';
import { NgClass, NgForOf, NgIf, NgStyle } from '@angular/common';
import { ButtonBoxComponent } from '../components/button-box/button-box.component';
import TranslateDirective from '../language/translate.directive';
import { TimeSlot } from '../../admin/salon/model/salon.interface';
import { Line } from './line.model';
import { Square } from './square.model';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'daily-planning',
  templateUrl: './daily-planning.component.html',
  styleUrls: ['./daily-planning.component.scss'],
  standalone: true,
  imports: [
    NgForOf,
    NgClass,
    NgStyle,
    ButtonBoxComponent,
    NgIf,
    TranslateDirective,
    FaIconComponent,
  ],
})
export class DailyPlanningComponent implements OnInit {
  @Input() timeslots: TimeSlot[] = [];
  @Input() categories: string[] = [];
  @Input() lines: Line[] = [];

  _lines: Line[] = [];

  positionColors: string[] = [];

  ngOnInit() {
    this.positionColors = this.generateColorPalette(this.categories.length);

    this._lines = [...this.lines];
  }

  assignPosition(line: string, idColumn: string): void {
    const current = this.getTimeSlot(line, idColumn);
    if (!current || current.category === 'Unavailable') {
      return;
    }

    const nextIndex = (this.categories.indexOf(current.category) + 1) % (this.categories.length);
    current.category = this.categories[nextIndex];
  }

  computeClasses(line: string, idColumn: string) {
    return {
      'unavailable-time': this.getTimeSlot(line, idColumn)?.category === 'Unavailable',
    };
  }

  computeStyles(line: string, idColumn: string) {
    const current = this.getTimeSlot(line, idColumn);
    if (!current || current.category === 'Unavailable') {
      return;
    }

    const index = this.categories.indexOf(current.category);
    return { 'background-color': index >= 0 ? this.positionColors[index] : 'transparent' };
  }

  getTimeSlot(idLine: string, idColumn: string): Square | undefined {
    return this._lines.find(line => line.idLine === idLine)?.squares?.find(square => square.idColumn === idColumn);
  }

  getIcon(idLine: string, idColumn: string): string {
    const current = this.getTimeSlot(idLine, idColumn);

    if (current?.category === 'Cuisine') {
      return 'fire-burner';
    } else if (current?.category === 'Vaisselle') {
      return 'shower';
    } else if (current?.category === 'Buvette') {
      return 'money-bill';
    } else if (current?.category === 'Pause') {
      return 'mug-hot';
    } else if (current?.category === 'Unavailable') {
      return 'user-slash';
    } else {
      return 'minus';
    }
  }

  private generateColorPalette(count: number): string[] {
    const baseColors = ['#C1D9E1', '#C1E1C1', '#FFDDC1',
                        '#D4C1E1', '#e3e8e3', '#DDDDDD',
    ];
    const palette: string[] = [];
    for (let i = 0; i < count; i++) {
      palette.push(baseColors[i % baseColors.length]);
    }
    return palette;
  }
}
