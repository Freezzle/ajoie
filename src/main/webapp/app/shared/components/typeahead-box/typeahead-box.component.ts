import { Component, Input, Self, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import SharedModule from '../../shared.module';
import { RouterLink } from '@angular/router';
import { ControlValueAccessor, FormControl, NgControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, filter, merge, Observable, OperatorFunction, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { ErrorBoxComponent } from '../../error-box/error-box.component';

@Component({
  imports: [CommonModule, SharedModule, RouterLink, ReactiveFormsModule, ErrorBoxComponent],
  selector: 'typeahead-box',
  standalone: true,
  styleUrl: './typeahead-box.component.scss',
  templateUrl: './typeahead-box.component.html',
})
export class TypeaheadBoxComponent implements ControlValueAccessor {
  @ViewChild('instance', { static: true }) instance!: NgbTypeahead;

  @Input()
  translateKey: string | undefined;
  @Input()
  fieldName: string = '';
  @Input()
  options: any[] = [];
  @Input()
  formatterFunction: (a: any) => string = (a: any) => JSON.parse(a);

  protected readonly Validators = Validators;

  value: string = '';
  focus$ = new Subject<string>();
  click$ = new Subject<string>();

  // placeholder methods
  onChange = (_: any) => {
  };
  onTouched = () => {
  };

  constructor(@Self() public controlDir: NgControl) {
    this.controlDir.valueAccessor = this;
  }

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  get control(): FormControl<any> {
    return this.controlDir.control as FormControl<any>;
  }

  search: OperatorFunction<string, readonly string[]> = (text$: Observable<string>) => {
    const debouncedText$ = text$.pipe(debounceTime(200), distinctUntilChanged());
    const clicksWithClosedPopup$ = this.click$.pipe(filter(() => !this.instance.isPopupOpen()));
    const inputFocus$ = this.focus$;

    return merge(debouncedText$, inputFocus$, clicksWithClosedPopup$).pipe(
      map((term) =>
        !term || term === '' ? this.options :
        this.options.filter(
          (option) => this.removeAccents(this.formatterFunction(option)).toLowerCase()
            .includes(this.removeAccents(term).toLocaleLowerCase())),
      ));
  };

  removeAccents(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
}

