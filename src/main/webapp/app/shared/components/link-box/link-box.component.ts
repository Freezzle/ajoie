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
  colorClass: string = 'btn-primary';
  @Input()
  isDisabled: boolean = false;
  @Input()
  translateKey: string = 'common.edit';
}
