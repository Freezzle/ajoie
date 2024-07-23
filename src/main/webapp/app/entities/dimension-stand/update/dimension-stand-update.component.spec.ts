import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, HttpResponse } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of, Subject, from } from 'rxjs';

import { DimensionStandService } from '../service/dimension-stand.service';
import { IDimensionStand } from '../dimension-stand.model';
import { DimensionStandFormService } from './dimension-stand-form.service';

import { DimensionStandUpdateComponent } from './dimension-stand-update.component';

describe('DimensionStand Management Update Component', () => {
  let comp: DimensionStandUpdateComponent;
  let fixture: ComponentFixture<DimensionStandUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let dimensionStandFormService: DimensionStandFormService;
  let dimensionStandService: DimensionStandService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DimensionStandUpdateComponent],
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
      .overrideTemplate(DimensionStandUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(DimensionStandUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    dimensionStandFormService = TestBed.inject(DimensionStandFormService);
    dimensionStandService = TestBed.inject(DimensionStandService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('Should update editForm', () => {
      const dimensionStand: IDimensionStand = { id: '1361f429-3817-4123-8ee3-fdf8943310b2' };

      activatedRoute.data = of({ dimensionStand });
      comp.ngOnInit();

      expect(comp.dimensionStand).toEqual(dimensionStand);
    });
  });

  describe('save', () => {
    it('Should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IDimensionStand>>();
      const dimensionStand = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
      jest.spyOn(dimensionStandFormService, 'getDimensionStand').mockReturnValue(dimensionStand);
      jest.spyOn(dimensionStandService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ dimensionStand });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: dimensionStand }));
      saveSubject.complete();

      // THEN
      expect(dimensionStandFormService.getDimensionStand).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(dimensionStandService.update).toHaveBeenCalledWith(expect.objectContaining(dimensionStand));
      expect(comp.isSaving).toEqual(false);
    });

    it('Should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IDimensionStand>>();
      const dimensionStand = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
      jest.spyOn(dimensionStandFormService, 'getDimensionStand').mockReturnValue({ id: null });
      jest.spyOn(dimensionStandService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ dimensionStand: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: dimensionStand }));
      saveSubject.complete();

      // THEN
      expect(dimensionStandFormService.getDimensionStand).toHaveBeenCalled();
      expect(dimensionStandService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('Should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IDimensionStand>>();
      const dimensionStand = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
      jest.spyOn(dimensionStandService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ dimensionStand });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(dimensionStandService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });
});
