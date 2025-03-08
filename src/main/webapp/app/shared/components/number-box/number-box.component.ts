import { Component, Input, Self } from '@angular/core';
import { CommonModule } from '@angular/common';
import SharedModule from '../../shared.module';
import { RouterLink } from '@angular/router';
import { ControlValueAccessor, FormControl, NgControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ErrorBoxComponent } from '../../error-box/error-box.component';

@Component({
  imports: [CommonModule, SharedModule, RouterLink, ReactiveFormsModule, ErrorBoxComponent],
  selector: 'number-box',
  standalone: true,
  styleUrl: './number-box.component.scss',
  templateUrl: './number-box.component.html',
})
export class NumberBoxComponent implements ControlValueAccessor {
  @Input()
  translateKey: string | undefined;
  @Input()
  fieldName: string = '';
  @Input()
  maxLength: number = 255;

  protected readonly Validators = Validators;

  disabled: boolean = false;
  value: number | null = null;

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
    this.value = (event.target as HTMLInputElement).value as unknown as number;
    this.onChange(this.value);
    this.onTouched();
  }

  get control(): FormControl<any> {
    return this.controlDir.control as FormControl<any>;
  }
}
