import {Component, signal} from '@angular/core';
import {AlertComponent} from "../../../shared/alert/alert.component";
import {AlertErrorComponent} from "../../../shared/alert/alert-error.component";
import {ButtonBoxComponent} from "../../../shared/components/button-box/button-box.component";
import {CardComponent} from "../../../shared/components/card/card.component";
import {ConfirmPopup} from "primeng/confirmpopup";
import {ContentPageComponent} from "../../../shared/components/content-page/content-page.component";
import {Toast} from "primeng/toast";
import {FaIconComponent} from "@fortawesome/angular-fontawesome";
import {TranslateModule} from "@ngx-translate/core";

@Component({
    selector: 'app-volunteer-planning',
    imports: [
        AlertComponent,
        AlertErrorComponent,
        ButtonBoxComponent,
        CardComponent,
        ConfirmPopup,
        ContentPageComponent,
        Toast,
        FaIconComponent,
        TranslateModule
    ],
    templateUrl: './volunteer-planning.component.html',
    styleUrl: './volunteer-planning.component.scss',
})
export class VolunteerPlanningComponent {
    isLoading = signal<boolean>(false);

    previousState(): void {
        window.history.back();
    }
}
