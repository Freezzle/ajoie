import { Component, Input, Self } from '@angular/core';
import { CommonModule } from '@angular/common';
import SharedModule from '../../shared.module';
import { RouterLink } from '@angular/router';
import { ControlValueAccessor, FormControl, NgControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ErrorBoxComponent } from '../../error-box/error-box.component';

@Component({
  imports: [CommonModule, SharedModule, RouterLink, ReactiveFormsModule, ErrorBoxComponent],
  selector: 'textarea-box',
  standalone: true,
  styleUrl: './textarea-box.component.scss',
  templateUrl: './textarea-box.component.html',
})
export class TextareaBoxComponent implements ControlValueAccessor {
  @Input()
  translateKey: string | undefined;

  @Input()
  fieldName: string = '';

  @Input()
  rows: number = 3;

  @Input()
  showCounter = false;

  @Input()
  maxLength: number | undefined;

  protected readonly Validators = Validators;

  disabled: boolean = false;
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

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
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
