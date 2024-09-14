import { Component, ElementRef, inject, input, OnInit, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { DurationPipe, FormatMediumDatePipe, FormatMediumDatetimePipe } from 'app/shared/date';
import { ISalon, ISalonStats } from '../salon.model';
import { SortByDirective, SortDirective } from '../../../shared/sort';
import { SalonService } from '../service/salon.service';
import { mergeMap } from 'rxjs/operators';
import { HttpResponse } from '@angular/common/http';
import { EMPTY, Observable, of } from 'rxjs';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

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
  stats$: Observable<ISalonStats> | undefined;
  selectedFile: File | null = null;

  protected salonService = inject(SalonService);

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.stats$ = this.salonService.stats(this.salon()!.id).pipe(
      mergeMap((stats: HttpResponse<ISalonStats>) => {
        if (stats.body) {
          return of(stats.body);
        }
        return EMPTY;
      }),
    );
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  generate(): void {
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
