import { Component, Input, Self } from '@angular/core';
import { CommonModule } from '@angular/common';
import SharedModule from '../../shared.module';
import { RouterLink } from '@angular/router';
import { ControlValueAccessor, FormControl, NgControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ErrorBoxComponent } from '../../error-box/error-box.component';

@Component({
  imports: [CommonModule, SharedModule, RouterLink, ReactiveFormsModule, ErrorBoxComponent],
  selector: 'select-box',
  standalone: true,
  styleUrl: './select-box.component.scss',
  templateUrl: './select-box.component.html',
})
export class SelectBoxComponent implements ControlValueAccessor {
  @Input()
  translateKey: string | undefined;
  @Input()
  fieldName: string = '';
  @Input()
  options: any[] = [];
  @Input()
  compareFunction: (a: any, b: any) => boolean = (a: any, b: any) => a === b;
  @Input()
  formatterFunction: (a: any) => string = (a: any) => JSON.parse(a);
  @Input()
  withEmptyOption: boolean = true;
  @Input()
  needTranslation: boolean = false;

  protected readonly Validators = Validators;

  value: string = '';

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

  onInput(event: Event) {
    this.value = (event.target as HTMLInputElement).value;
    this.onChange(this.value);
    this.onTouched();
  }

  get control(): FormControl<any> {
    return this.controlDir.control as FormControl<any>;
  }
}
