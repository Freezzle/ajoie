import {Component, inject, input, OnInit} from '@angular/core';
import {RouterModule} from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import {DurationPipe, FormatMediumDatePipe, FormatMediumDatetimePipe} from 'app/shared/date';
import {ISalon, ISalonStats} from '../salon.model';
import {SortByDirective, SortDirective} from '../../../shared/sort';
import {SalonService} from '../service/salon.service';
import {mergeMap} from 'rxjs/operators';
import {HttpResponse} from '@angular/common/http';
import {EMPTY, Observable, of} from 'rxjs';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";

@Component({
    standalone: true,
    selector: 'jhi-salon-stats',
    templateUrl: './salon-stats.component.html',
    imports: [SharedModule, RouterModule, DurationPipe, FormatMediumDatetimePipe, FormatMediumDatePipe, SortByDirective,
              SortDirective, FormsModule, ReactiveFormsModule],
})
export class SalonStatsComponent implements OnInit {
    salon = input<ISalon | null>(null);
    stats$: Observable<ISalonStats> | undefined;
    selectedFile: File | null = null;
    uploadResponse: any;

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
        this.salonService.generate(this.salon()!.id).subscribe(() => {
            this.loadStats();
        });
    }

    previousState(): void {
        window.history.back();
    }
}
