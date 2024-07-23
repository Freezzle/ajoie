import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, HttpResponse } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of, Subject, from } from 'rxjs';

import { ExponentService } from '../service/exponent.service';
import { IExponent } from '../exponent.model';
import { ExponentFormService } from './exponent-form.service';

import { ExponentUpdateComponent } from './exponent-update.component';

describe('Exponent Management Update Component', () => {
  let comp: ExponentUpdateComponent;
  let fixture: ComponentFixture<ExponentUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let exponentFormService: ExponentFormService;
  let exponentService: ExponentService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ExponentUpdateComponent],
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
      .overrideTemplate(ExponentUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(ExponentUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    exponentFormService = TestBed.inject(ExponentFormService);
    exponentService = TestBed.inject(ExponentService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('Should update editForm', () => {
      const exponent: IExponent = { id: '1361f429-3817-4123-8ee3-fdf8943310b2' };

      activatedRoute.data = of({ exponent });
      comp.ngOnInit();

      expect(comp.exponent).toEqual(exponent);
    });
  });

  describe('save', () => {
    it('Should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IExponent>>();
      const exponent = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
      jest.spyOn(exponentFormService, 'getExponent').mockReturnValue(exponent);
      jest.spyOn(exponentService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ exponent });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: exponent }));
      saveSubject.complete();

      // THEN
      expect(exponentFormService.getExponent).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(exponentService.update).toHaveBeenCalledWith(expect.objectContaining(exponent));
      expect(comp.isSaving).toEqual(false);
    });

    it('Should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IExponent>>();
      const exponent = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
      jest.spyOn(exponentFormService, 'getExponent').mockReturnValue({ id: null });
      jest.spyOn(exponentService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ exponent: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: exponent }));
      saveSubject.complete();

      // THEN
      expect(exponentFormService.getExponent).toHaveBeenCalled();
      expect(exponentService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('Should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IExponent>>();
      const exponent = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
      jest.spyOn(exponentService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ exponent });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(exponentService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });
});
