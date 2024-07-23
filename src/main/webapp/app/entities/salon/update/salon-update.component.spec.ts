import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, HttpResponse } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of, Subject, from } from 'rxjs';

import { SalonService } from '../service/salon.service';
import { ISalon } from '../salon.model';
import { SalonFormService } from './salon-form.service';

import { SalonUpdateComponent } from './salon-update.component';

describe('Salon Management Update Component', () => {
  let comp: SalonUpdateComponent;
  let fixture: ComponentFixture<SalonUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let salonFormService: SalonFormService;
  let salonService: SalonService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SalonUpdateComponent],
      providers: [
        provideHttpClient(),
        FormBuilder,
        {
          provide: ActivatedRoute,
          useValue: {
            params: from([{}]),
          },
        },
      ],
    })
      .overrideTemplate(SalonUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(SalonUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    salonFormService = TestBed.inject(SalonFormService);
    salonService = TestBed.inject(SalonService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('Should update editForm', () => {
      const salon: ISalon = { id: '1361f429-3817-4123-8ee3-fdf8943310b2' };

      activatedRoute.data = of({ salon });
      comp.ngOnInit();

      expect(comp.salon).toEqual(salon);
    });
  });

  describe('save', () => {
    it('Should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<ISalon>>();
      const salon = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
      jest.spyOn(salonFormService, 'getSalon').mockReturnValue(salon);
      jest.spyOn(salonService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ salon });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: salon }));
      saveSubject.complete();

      // THEN
      expect(salonFormService.getSalon).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(salonService.update).toHaveBeenCalledWith(expect.objectContaining(salon));
      expect(comp.isSaving).toEqual(false);
    });

    it('Should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<ISalon>>();
      const salon = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
      jest.spyOn(salonFormService, 'getSalon').mockReturnValue({ id: null });
      jest.spyOn(salonService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ salon: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: salon }));
      saveSubject.complete();

      // THEN
      expect(salonFormService.getSalon).toHaveBeenCalled();
      expect(salonService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('Should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<ISalon>>();
      const salon = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
      jest.spyOn(salonService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ salon });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(salonService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });
});
