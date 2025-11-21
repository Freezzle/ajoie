import {Component} from '@angular/core';
import {Menubar} from "primeng/menubar";

@Component({
  selector: 'app-content-page',
  imports: [
    Menubar
  ],
  templateUrl: './content-page.component.html',
  styleUrl: './content-page.component.scss',
})
export class ContentPageComponent {
}
