import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import SharedModule from '../../shared.module';

@Component({
  imports: [FaIconComponent, CommonModule, SharedModule],
  selector: 'button-box',
  standalone: true,
  styleUrl: './button-box.component.scss',
  templateUrl: './button-box.component.html',
})
export class ButtonBoxComponent {
  @Input()
  colorClass: string = 'btn-primary';
  @Input()
  isDisabled: boolean = false;
  @Input()
  translateKey: string = 'common.edit';
  @Input()
  faIcon: string | null = null;
  @Input()
  isSubmit: boolean = false;

  @Output()
  clickedEvent = new EventEmitter<void>();

  onClick(): void {
    this.clickedEvent.emit();
  }
}
