import { Component, ElementRef, inject, input, OnInit, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { DurationPipe, FormatMediumDatePipe, FormatMediumDatetimePipe } from 'app/shared/date';
import { ISalon, ISalonStats } from '../salon.model';
import { SortByDirective, SortDirective } from '../../../shared/sort';
import { SalonService } from '../service/salon.service';
import { mergeMap } from 'rxjs/operators';
import { combineLatest, EMPTY, Observable, of } from 'rxjs';
import { HttpResponse } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Status } from '../../enumerations/status.model';

@Component({
  standalone: true,
  selector: 'jhi-salon-stats',
  templateUrl: './salon-stats.component.html',
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

  dimensionStandsEntries(dimension: Record<string, number>): [string, number][] {
    return Object.entries(dimension);
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
}
