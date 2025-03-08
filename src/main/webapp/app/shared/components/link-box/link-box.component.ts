import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import SharedModule from '../../shared.module';
import { RouterLink } from '@angular/router';

@Component({
  imports: [CommonModule, SharedModule, RouterLink],
  selector: 'link-box',
  standalone: true,
  styleUrl: './link-box.component.scss',
  templateUrl: './link-box.component.html',
})
export class LinkBoxComponent {
  @Input()
  links: string[] = [];
  @Input()
  faIcon: string | null = null;
  @Input()
  faIconAnimation: 'spin' | undefined = undefined;
  @Input()
  type: 'primary' | 'secondary' | 'warning' | 'danger' | 'success' = 'primary';
  @Input()
  isDisabled: boolean = false;
  @Input()
  translateKey: string = 'common.edit';

  get colorButton() {
    if (this.type === 'primary') {
      return 'btn-primary';
    } else if (this.type === 'secondary') {
      return 'btn-secondary';
    } else if (this.type === 'warning') {
      return 'btn-warning';
    } else if (this.type === 'danger') {
      return 'btn-danger';
    } else if (this.type === 'success') {
      return 'btn-success';
    } else {
      return 'btn-primary';
    }
  }
}
