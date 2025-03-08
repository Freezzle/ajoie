import { Component, inject, OnInit } from '@angular/core';
import { AsyncPipe, DatePipe, KeyValuePipe, NgForOf, NgIf } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { DailyPlanningComponent } from '../../../shared/daily-planning/daily-planning.component';
import { ButtonBoxComponent } from '../../../shared/components/button-box/button-box.component';
import TranslateDirective from '../../../shared/language/translate.directive';
import { SalonService } from '../../salon/service/salon.service';
import { combineLatest, Observable } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { TimeSlotMap } from '../../salon/model/salon.interface';
import { Line } from '../../../shared/daily-planning/line.model';

@Component({
  standalone: true,
  selector: 'jhi-volunteer-planning',
  templateUrl: './volunteer-planning.component.html',
  imports: [DatePipe, FaIconComponent, DailyPlanningComponent, ButtonBoxComponent, NgIf, TranslateDirective, NgForOf,
            AsyncPipe, KeyValuePipe],
})
export class VolunteerPlanningComponent implements OnInit {
  isLoading = false;

  private salonService = inject(SalonService);
  private activatedRoute = inject(ActivatedRoute);

  timeSlotsMap!: Observable<TimeSlotMap>;

  constructor() {
  }

  ngOnInit() {
    combineLatest([this.activatedRoute.paramMap]).subscribe(([params]) => {
      this.timeSlotsMap = this.salonService.getTimeSlots(params.get('idSalon'));
    });
  }

  previousState(): void {
    window.history.back();
  }

  lines(): Line[] {
    return [{
      'idLine': 'Béatrice', 'label': 'Béatrice',
      'squares': [{ 'idColumn': 'f7c73147-f131-4272-bd68-bede986044e6', 'category': 'Unavailable' },
        { 'idColumn': '3d6dc065-28ab-432d-97a8-0daaa8e7be3a', 'category': 'Unavailable' },
        { 'idColumn': '58c56893-8ae9-4068-9021-c8f87e26bc5a', 'category': 'Unavailable' },
        { 'idColumn': '049f3034-8ad4-4f5d-a42c-801a91154b6c', 'category': 'Unavailable' },
        { 'idColumn': 'f3219fbd-bc4c-4f03-ac49-d840172a567c', 'category': 'Vaisselle' },
        { 'idColumn': 'c1da0300-d3f0-4dba-ad1b-d55b89aed198', 'category': 'Vaisselle' },
        { 'idColumn': '24eccc26-1ee7-490f-9319-cc4bd93ba62b', 'category': 'Vaisselle' },
        { 'idColumn': 'e6009a85-2f49-4d20-a267-602df5d0857d', 'category': 'Unavailable' },
        { 'idColumn': '0bb8d1b1-d0ed-4c86-9994-a7f12f2ba21c', 'category': 'Unavailable' },
        { 'idColumn': '0345395b-a0b1-46c0-a2c3-d55745f12599', 'category': 'Unavailable' }],
    }, {
      'idLine': 'Mélanie', 'label': 'Mélanie',
      'squares': [{ 'idColumn': 'f7c73147-f131-4272-bd68-bede986044e6', 'category': 'Buvette' },
        { 'idColumn': '3d6dc065-28ab-432d-97a8-0daaa8e7be3a', 'category': 'Buvette' },
        { 'idColumn': '58c56893-8ae9-4068-9021-c8f87e26bc5a', 'category': 'Buvette' },
        { 'idColumn': '049f3034-8ad4-4f5d-a42c-801a91154b6c', 'category': 'Buvette' },
        { 'idColumn': 'f3219fbd-bc4c-4f03-ac49-d840172a567c', 'category': 'Buvette' },
        { 'idColumn': 'c1da0300-d3f0-4dba-ad1b-d55b89aed198', 'category': 'Pause' },
        { 'idColumn': '24eccc26-1ee7-490f-9319-cc4bd93ba62b', 'category': 'Pause' },
        { 'idColumn': 'e6009a85-2f49-4d20-a267-602df5d0857d', 'category': 'Buvette' },
        { 'idColumn': '0bb8d1b1-d0ed-4c86-9994-a7f12f2ba21c', 'category': 'Buvette' },
        { 'idColumn': '0345395b-a0b1-46c0-a2c3-d55745f12599', 'category': 'Buvette' }],
    }, {
      'idLine': 'Charlène', 'label': 'Charlène',
      'squares': [{ 'idColumn': 'f7c73147-f131-4272-bd68-bede986044e6', 'category': 'Pause' },
        { 'idColumn': '3d6dc065-28ab-432d-97a8-0daaa8e7be3a', 'category': 'Pause' },
        { 'idColumn': '58c56893-8ae9-4068-9021-c8f87e26bc5a', 'category': 'Buvette' },
        { 'idColumn': '049f3034-8ad4-4f5d-a42c-801a91154b6c', 'category': 'Buvette' },
        { 'idColumn': 'f3219fbd-bc4c-4f03-ac49-d840172a567c', 'category': 'Buvette' },
        { 'idColumn': 'c1da0300-d3f0-4dba-ad1b-d55b89aed198', 'category': 'Pause' },
        { 'idColumn': '24eccc26-1ee7-490f-9319-cc4bd93ba62b', 'category': 'Pause' },
        { 'idColumn': 'e6009a85-2f49-4d20-a267-602df5d0857d', 'category': 'Buvette' },
        { 'idColumn': '0bb8d1b1-d0ed-4c86-9994-a7f12f2ba21c', 'category': 'Buvette' },
        { 'idColumn': '0345395b-a0b1-46c0-a2c3-d55745f12599', 'category': 'Buvette' }],
    }, {
      'idLine': 'Raphaël', 'label': 'Raphaël',
      'squares': [{ 'idColumn': 'f7c73147-f131-4272-bd68-bede986044e6', 'category': 'Pause' },
        { 'idColumn': '3d6dc065-28ab-432d-97a8-0daaa8e7be3a', 'category': 'Pause' },
        { 'idColumn': '58c56893-8ae9-4068-9021-c8f87e26bc5a', 'category': 'Cuisine' },
        { 'idColumn': '049f3034-8ad4-4f5d-a42c-801a91154b6c', 'category': 'Cuisine' },
        { 'idColumn': 'f3219fbd-bc4c-4f03-ac49-d840172a567c', 'category': 'Cuisine' },
        { 'idColumn': 'c1da0300-d3f0-4dba-ad1b-d55b89aed198', 'category': 'Buvette' },
        { 'idColumn': '24eccc26-1ee7-490f-9319-cc4bd93ba62b', 'category': 'Buvette' },
        { 'idColumn': 'e6009a85-2f49-4d20-a267-602df5d0857d', 'category': 'Pause' },
        { 'idColumn': '0bb8d1b1-d0ed-4c86-9994-a7f12f2ba21c', 'category': 'Pause' },
        { 'idColumn': '0345395b-a0b1-46c0-a2c3-d55745f12599', 'category': 'Pause' }],
    }, {
      'idLine': 'Maeva', 'label': 'Maeva',
      'squares': [{ 'idColumn': 'f7c73147-f131-4272-bd68-bede986044e6', 'category': 'Vaisselle' },
        { 'idColumn': '3d6dc065-28ab-432d-97a8-0daaa8e7be3a', 'category': 'Vaisselle' },
        { 'idColumn': '58c56893-8ae9-4068-9021-c8f87e26bc5a', 'category': 'Pause' },
        { 'idColumn': '049f3034-8ad4-4f5d-a42c-801a91154b6c', 'category': 'Pause' },
        { 'idColumn': 'f3219fbd-bc4c-4f03-ac49-d840172a567c', 'category': 'Pause' },
        { 'idColumn': 'c1da0300-d3f0-4dba-ad1b-d55b89aed198', 'category': 'Buvette' },
        { 'idColumn': '24eccc26-1ee7-490f-9319-cc4bd93ba62b', 'category': 'Buvette' },
        { 'idColumn': 'e6009a85-2f49-4d20-a267-602df5d0857d', 'category': 'Pause' },
        { 'idColumn': '0bb8d1b1-d0ed-4c86-9994-a7f12f2ba21c', 'category': 'Pause' },
        { 'idColumn': '0345395b-a0b1-46c0-a2c3-d55745f12599', 'category': 'Pause' }],
    }, {
      'idLine': 'Dylan', 'label': 'Dylan',
      'squares': [{ 'idColumn': 'f7c73147-f131-4272-bd68-bede986044e6', 'category': 'Buvette' },
        { 'idColumn': '3d6dc065-28ab-432d-97a8-0daaa8e7be3a', 'category': 'Buvette' },
        { 'idColumn': '58c56893-8ae9-4068-9021-c8f87e26bc5a', 'category': 'Buvette' },
        { 'idColumn': '049f3034-8ad4-4f5d-a42c-801a91154b6c', 'category': 'Buvette' },
        { 'idColumn': 'f3219fbd-bc4c-4f03-ac49-d840172a567c', 'category': 'Buvette' },
        { 'idColumn': 'c1da0300-d3f0-4dba-ad1b-d55b89aed198', 'category': 'Pause' },
        { 'idColumn': '24eccc26-1ee7-490f-9319-cc4bd93ba62b', 'category': 'Pause' },
        { 'idColumn': 'e6009a85-2f49-4d20-a267-602df5d0857d', 'category': 'Buvette' },
        { 'idColumn': '0bb8d1b1-d0ed-4c86-9994-a7f12f2ba21c', 'category': 'Buvette' },
        { 'idColumn': '0345395b-a0b1-46c0-a2c3-d55745f12599', 'category': 'Buvette' }],
    }, {
      'idLine': 'Jeanine', 'label': 'Jeanine',
      'squares': [{ 'idColumn': 'f7c73147-f131-4272-bd68-bede986044e6', 'category': 'Pause' },
        { 'idColumn': '3d6dc065-28ab-432d-97a8-0daaa8e7be3a', 'category': 'Pause' },
        { 'idColumn': '58c56893-8ae9-4068-9021-c8f87e26bc5a', 'category': 'Cuisine' },
        { 'idColumn': '049f3034-8ad4-4f5d-a42c-801a91154b6c', 'category': 'Cuisine' },
        { 'idColumn': 'f3219fbd-bc4c-4f03-ac49-d840172a567c', 'category': 'Cuisine' },
        { 'idColumn': 'c1da0300-d3f0-4dba-ad1b-d55b89aed198', 'category': 'Vaisselle' },
        { 'idColumn': '24eccc26-1ee7-490f-9319-cc4bd93ba62b', 'category': 'Vaisselle' },
        { 'idColumn': 'e6009a85-2f49-4d20-a267-602df5d0857d', 'category': 'Pause' },
        { 'idColumn': '0bb8d1b1-d0ed-4c86-9994-a7f12f2ba21c', 'category': 'Pause' },
        { 'idColumn': '0345395b-a0b1-46c0-a2c3-d55745f12599', 'category': 'Pause' }],
    }, {
      'idLine': 'Mickael', 'label': 'Mickael',
      'squares': [{ 'idColumn': 'f7c73147-f131-4272-bd68-bede986044e6', 'category': 'Vaisselle' },
        { 'idColumn': '3d6dc065-28ab-432d-97a8-0daaa8e7be3a', 'category': 'Vaisselle' },
        { 'idColumn': '58c56893-8ae9-4068-9021-c8f87e26bc5a', 'category': 'Cuisine' },
        { 'idColumn': '049f3034-8ad4-4f5d-a42c-801a91154b6c', 'category': 'Cuisine' },
        { 'idColumn': 'f3219fbd-bc4c-4f03-ac49-d840172a567c', 'category': 'Cuisine' },
        { 'idColumn': 'c1da0300-d3f0-4dba-ad1b-d55b89aed198', 'category': 'Pause' },
        { 'idColumn': '24eccc26-1ee7-490f-9319-cc4bd93ba62b', 'category': 'Pause' },
        { 'idColumn': 'e6009a85-2f49-4d20-a267-602df5d0857d', 'category': 'Vaisselle' },
        { 'idColumn': '0bb8d1b1-d0ed-4c86-9994-a7f12f2ba21c', 'category': 'Vaisselle' },
        { 'idColumn': '0345395b-a0b1-46c0-a2c3-d55745f12599', 'category': 'Vaisselle' }],
    }, {
      'idLine': 'Anaïs', 'label': 'Anaïs',
      'squares': [{ 'idColumn': 'f7c73147-f131-4272-bd68-bede986044e6', 'category': 'Pause' },
        { 'idColumn': '3d6dc065-28ab-432d-97a8-0daaa8e7be3a', 'category': 'Pause' },
        { 'idColumn': '58c56893-8ae9-4068-9021-c8f87e26bc5a', 'category': 'Vaisselle' },
        { 'idColumn': '049f3034-8ad4-4f5d-a42c-801a91154b6c', 'category': 'Vaisselle' },
        { 'idColumn': 'f3219fbd-bc4c-4f03-ac49-d840172a567c', 'category': 'Vaisselle' },
        { 'idColumn': 'c1da0300-d3f0-4dba-ad1b-d55b89aed198', 'category': 'Pause' },
        { 'idColumn': '24eccc26-1ee7-490f-9319-cc4bd93ba62b', 'category': 'Pause' },
        { 'idColumn': 'e6009a85-2f49-4d20-a267-602df5d0857d', 'category': 'Vaisselle' },
        { 'idColumn': '0bb8d1b1-d0ed-4c86-9994-a7f12f2ba21c', 'category': 'Vaisselle' },
        { 'idColumn': '0345395b-a0b1-46c0-a2c3-d55745f12599', 'category': 'Vaisselle' }],
    }, {
      'idLine': 'Pascal', 'label': 'Pascal',
      'squares': [{ 'idColumn': 'f7c73147-f131-4272-bd68-bede986044e6', 'category': 'Pause' },
        { 'idColumn': '3d6dc065-28ab-432d-97a8-0daaa8e7be3a', 'category': 'Pause' },
        { 'idColumn': '58c56893-8ae9-4068-9021-c8f87e26bc5a', 'category': 'Cuisine' },
        { 'idColumn': '049f3034-8ad4-4f5d-a42c-801a91154b6c', 'category': 'Cuisine' },
        { 'idColumn': 'f3219fbd-bc4c-4f03-ac49-d840172a567c', 'category': 'Cuisine' },
        { 'idColumn': 'c1da0300-d3f0-4dba-ad1b-d55b89aed198', 'category': 'Pause' },
        { 'idColumn': '24eccc26-1ee7-490f-9319-cc4bd93ba62b', 'category': 'Pause' },
        { 'idColumn': 'e6009a85-2f49-4d20-a267-602df5d0857d', 'category': 'Pause' },
        { 'idColumn': '0bb8d1b1-d0ed-4c86-9994-a7f12f2ba21c', 'category': 'Pause' },
        { 'idColumn': '0345395b-a0b1-46c0-a2c3-d55745f12599', 'category': 'Pause' }],
    }, {
      'idLine': 'Esma', 'label': 'Esma',
      'squares': [{ 'idColumn': 'f7c73147-f131-4272-bd68-bede986044e6', 'category': 'Unavailable' },
        { 'idColumn': '3d6dc065-28ab-432d-97a8-0daaa8e7be3a', 'category': 'Unavailable' },
        { 'idColumn': '58c56893-8ae9-4068-9021-c8f87e26bc5a', 'category': 'Cuisine' },
        { 'idColumn': '049f3034-8ad4-4f5d-a42c-801a91154b6c', 'category': 'Cuisine' },
        { 'idColumn': 'f3219fbd-bc4c-4f03-ac49-d840172a567c', 'category': 'Cuisine' },
        { 'idColumn': 'c1da0300-d3f0-4dba-ad1b-d55b89aed198', 'category': 'Unavailable' },
        { 'idColumn': '24eccc26-1ee7-490f-9319-cc4bd93ba62b', 'category': 'Unavailable' },
        { 'idColumn': 'e6009a85-2f49-4d20-a267-602df5d0857d', 'category': 'Unavailable' },
        { 'idColumn': '0bb8d1b1-d0ed-4c86-9994-a7f12f2ba21c', 'category': 'Unavailable' },
        { 'idColumn': '0345395b-a0b1-46c0-a2c3-d55745f12599', 'category': 'Unavailable' }],
    }, {
      'idLine': 'François', 'label': 'François',
      'squares': [{ 'idColumn': 'f7c73147-f131-4272-bd68-bede986044e6', 'category': 'Unavailable' },
        { 'idColumn': '3d6dc065-28ab-432d-97a8-0daaa8e7be3a', 'category': 'Unavailable' },
        { 'idColumn': '58c56893-8ae9-4068-9021-c8f87e26bc5a', 'category': 'Unavailable' },
        { 'idColumn': '049f3034-8ad4-4f5d-a42c-801a91154b6c', 'category': 'Cuisine' },
        { 'idColumn': 'f3219fbd-bc4c-4f03-ac49-d840172a567c', 'category': 'Cuisine' },
        { 'idColumn': 'c1da0300-d3f0-4dba-ad1b-d55b89aed198', 'category': 'Cuisine' },
        { 'idColumn': '24eccc26-1ee7-490f-9319-cc4bd93ba62b', 'category': 'Unavailable' },
        { 'idColumn': 'e6009a85-2f49-4d20-a267-602df5d0857d', 'category': 'Unavailable' },
        { 'idColumn': '0bb8d1b1-d0ed-4c86-9994-a7f12f2ba21c', 'category': 'Unavailable' },
        { 'idColumn': '0345395b-a0b1-46c0-a2c3-d55745f12599', 'category': 'Unavailable' }],
    }, {
      'idLine': 'Leila', 'label': 'Leila',
      'squares': [{ 'idColumn': 'f7c73147-f131-4272-bd68-bede986044e6', 'category': 'Unavailable' },
        { 'idColumn': '3d6dc065-28ab-432d-97a8-0daaa8e7be3a', 'category': 'Unavailable' },
        { 'idColumn': '58c56893-8ae9-4068-9021-c8f87e26bc5a', 'category': 'Unavailable' },
        { 'idColumn': '049f3034-8ad4-4f5d-a42c-801a91154b6c', 'category': 'Unavailable' },
        { 'idColumn': 'f3219fbd-bc4c-4f03-ac49-d840172a567c', 'category': 'Unavailable' },
        { 'idColumn': 'c1da0300-d3f0-4dba-ad1b-d55b89aed198', 'category': 'Unavailable' },
        { 'idColumn': '24eccc26-1ee7-490f-9319-cc4bd93ba62b', 'category': 'Unavailable' },
        { 'idColumn': 'e6009a85-2f49-4d20-a267-602df5d0857d', 'category': 'Unavailable' },
        { 'idColumn': '0bb8d1b1-d0ed-4c86-9994-a7f12f2ba21c', 'category': 'Unavailable' },
        { 'idColumn': '0345395b-a0b1-46c0-a2c3-d55745f12599', 'category': 'Unavailable' }],
    }, {
      'idLine': 'Yagmur', 'label': 'Yagmur',
      'squares': [{ 'idColumn': 'f7c73147-f131-4272-bd68-bede986044e6', 'category': 'Unavailable' },
        { 'idColumn': '3d6dc065-28ab-432d-97a8-0daaa8e7be3a', 'category': 'Unavailable' },
        { 'idColumn': '58c56893-8ae9-4068-9021-c8f87e26bc5a', 'category': 'Unavailable' },
        { 'idColumn': '049f3034-8ad4-4f5d-a42c-801a91154b6c', 'category': 'Unavailable' },
        { 'idColumn': 'f3219fbd-bc4c-4f03-ac49-d840172a567c', 'category': 'Unavailable' },
        { 'idColumn': 'c1da0300-d3f0-4dba-ad1b-d55b89aed198', 'category': 'Unavailable' },
        { 'idColumn': '24eccc26-1ee7-490f-9319-cc4bd93ba62b', 'category': 'Unavailable' },
        { 'idColumn': 'e6009a85-2f49-4d20-a267-602df5d0857d', 'category': 'Unavailable' },
        { 'idColumn': '0bb8d1b1-d0ed-4c86-9994-a7f12f2ba21c', 'category': 'Unavailable' },
        { 'idColumn': '0345395b-a0b1-46c0-a2c3-d55745f12599', 'category': 'Unavailable' }],
    }, {
      'idLine': 'Dina', 'label': 'Dina',
      'squares': [{ 'idColumn': 'f7c73147-f131-4272-bd68-bede986044e6', 'category': 'Unavailable' },
        { 'idColumn': '3d6dc065-28ab-432d-97a8-0daaa8e7be3a', 'category': 'Cuisine' },
        { 'idColumn': '58c56893-8ae9-4068-9021-c8f87e26bc5a', 'category': 'Cuisine' },
        { 'idColumn': '049f3034-8ad4-4f5d-a42c-801a91154b6c', 'category': 'Cuisine' },
        { 'idColumn': 'f3219fbd-bc4c-4f03-ac49-d840172a567c', 'category': 'Unavailable' },
        { 'idColumn': 'c1da0300-d3f0-4dba-ad1b-d55b89aed198', 'category': 'Unavailable' },
        { 'idColumn': '24eccc26-1ee7-490f-9319-cc4bd93ba62b', 'category': 'Unavailable' },
        { 'idColumn': 'e6009a85-2f49-4d20-a267-602df5d0857d', 'category': 'Unavailable' },
        { 'idColumn': '0bb8d1b1-d0ed-4c86-9994-a7f12f2ba21c', 'category': 'Unavailable' },
        { 'idColumn': '0345395b-a0b1-46c0-a2c3-d55745f12599', 'category': 'Unavailable' }],
    }, {
      'idLine': 'Laurine', 'label': 'Laurine',
      'squares': [{ 'idColumn': 'f7c73147-f131-4272-bd68-bede986044e6', 'category': 'Unavailable' },
        { 'idColumn': '3d6dc065-28ab-432d-97a8-0daaa8e7be3a', 'category': 'Unavailable' },
        { 'idColumn': '58c56893-8ae9-4068-9021-c8f87e26bc5a', 'category': 'Unavailable' },
        { 'idColumn': '049f3034-8ad4-4f5d-a42c-801a91154b6c', 'category': 'Unavailable' },
        { 'idColumn': 'f3219fbd-bc4c-4f03-ac49-d840172a567c', 'category': 'Unavailable' },
        { 'idColumn': 'c1da0300-d3f0-4dba-ad1b-d55b89aed198', 'category': 'Unavailable' },
        { 'idColumn': '24eccc26-1ee7-490f-9319-cc4bd93ba62b', 'category': 'Unavailable' },
        { 'idColumn': 'e6009a85-2f49-4d20-a267-602df5d0857d', 'category': 'Unavailable' },
        { 'idColumn': '0bb8d1b1-d0ed-4c86-9994-a7f12f2ba21c', 'category': 'Unavailable' },
        { 'idColumn': '0345395b-a0b1-46c0-a2c3-d55745f12599', 'category': 'Unavailable' }],
    }];
  }
}
