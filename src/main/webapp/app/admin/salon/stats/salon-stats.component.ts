import { Component, ElementRef, inject, input, OnInit, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { DurationPipe, FormatMediumDatePipe, FormatMediumDatetimePipe } from 'app/shared/date';
import { ISalon } from '../model/salon.interface';
import { SortByDirective, SortDirective } from '../../../shared/sort';
import { SalonService } from '../service/salon.service';
import { mergeMap } from 'rxjs/operators';
import { combineLatest, EMPTY, Observable, of } from 'rxjs';
import { HttpResponse } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Status } from '../../enumerations/status.model';
import { ButtonBoxComponent } from '../../../shared/components/button-box/button-box.component';
import { LinkBoxComponent } from '../../../shared/components/link-box/link-box.component';
import ColorStatusPipe from '../../../shared/pipe/color-status.pipe';
import StatusPipe from '../../../shared/pipe/status.pipe';
import { ISalonStats } from '../model/salon-stats.interface';
import { getFormattedParticipationName } from '../../participation/model/participation.interface';

@Component({
  standalone: true,
  selector: 'jhi-salon-stats',
  templateUrl: './salon-stats.component.html',
  styleUrl: './salon-stats.component.scss',
  imports: [
    SharedModule,
    RouterModule,
    DurationPipe,
    FormatMediumDatetimePipe,
    FormatMediumDatePipe,
    SortByDirective,
    SortDirective,
    FormsModule,
    ReactiveFormsModule,
    ButtonBoxComponent,
    LinkBoxComponent,
    ColorStatusPipe,
    StatusPipe,
  ],
})
export class SalonStatsComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;

  salon = input<ISalon | null>(null);
  combinedStats$: Observable<ISalonStats[]> | undefined;
  selectedFile: File | null = null;
  protected salonService = inject(SalonService);

  ngOnInit(): void {
    this.loadStats();
  }

  packStatsByKey(cancelledDimensions: Record<string, number>,
                 runningDimensions: Record<string, number>,
                 acceptedDimensions: Record<string, number>): [string, [number, number, number]][] {
    const result: Record<string, [number, number, number]> = {};

    // Ajouter les valeurs de runningDimensions
    for (const [key, value] of Object.entries(runningDimensions)) {
      result[key] = [value, acceptedDimensions[key] ?? 0, cancelledDimensions[key] ?? 0];
    }

    // Ajouter les valeurs de acceptedDimensions qui ne sont pas dans runningDimensions
    for (const [key, value] of Object.entries(acceptedDimensions)) {
      if (!(key in result)) {
        result[key] = [0, value, 0];
      }
    }

    // Ajouter les valeurs de runningDimensions
    for (const [key, value] of Object.entries(cancelledDimensions)) {
      if (!(key in result)) {
        result[key] = [0, 0, value];
      }
    }

    return Object.entries(result);
  }

  loadStats(): void {
    this.combinedStats$ = combineLatest([
      this.salonService.stats(this.salon()!.id, [Status.IN_VERIFICATION]).pipe(
        mergeMap((stats: HttpResponse<ISalonStats>) => {
          if (stats.body) {
            return of(stats.body);
          }
          return EMPTY;
        }),
      ),
      this.salonService.stats(this.salon()!.id, [Status.ACCEPTED, Status.PAID]).pipe(
        mergeMap((stats: HttpResponse<ISalonStats>) => {
          if (stats.body) {
            return of(stats.body);
          }
          return EMPTY;
        }),
      ),
      this.salonService.stats(this.salon()!.id, [Status.CANCELED, Status.REFUSED]).pipe(
        mergeMap((stats: HttpResponse<ISalonStats>) => {
          if (stats.body) {
            return of(stats.body);
          }
          return EMPTY;
        }),
      ),
    ]);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  importFile(): void {
    if (this.selectedFile == null) {
      return;
    }

    this.salonService.generate(this.salon()!.id, this.selectedFile!).subscribe(() => {
      if (this.fileInput) {
        this.fileInput.nativeElement.value = ''; // Reset the file input field
      }

      this.selectedFile = null;
      this.loadStats();
    });
  }

  previousState(): void {
    window.history.back();
  }

  calculateFacturation(stat: { paid: number, discount: number, expected: number }): [number, number, number] {
    const sumTotal = stat.expected + stat.discount;

    const resultPaid = stat.paid / sumTotal * 100;
    const resultDiscount = stat.discount / sumTotal * 100;
    const remaining = 100 - resultDiscount - resultPaid;

    return [remaining, resultPaid, resultDiscount];
  }

  protected readonly getFormattedParticipationName = getFormattedParticipationName;
}
