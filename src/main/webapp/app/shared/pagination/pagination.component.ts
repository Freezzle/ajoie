import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {NgbPagination} from '@ng-bootstrap/ng-bootstrap';
import ItemCountComponent from './item-count.component';
import {PaginationEvent} from './pagination-event.interface';

@Component({
               selector: 'app-pagination',
               templateUrl: './pagination.component.html',
               imports: [
                   NgbPagination,
                   ItemCountComponent
               ]
           })
export class PaginationComponent implements OnInit {
    @Input()
    collectionSize!: number;
    @Input()
    pageSize: number = 10;
    @Input()
    page: number = 1;
    @Output()
    pageChanged = new EventEmitter<PaginationEvent>;

    ngOnInit(): void {
        this.onPageChanged(this.page);
    }

    onPageChanged(event: number): void {
        this.page = event;
        this.pageChanged.emit({page: this.page, pageSize: this.pageSize});
    }
}
