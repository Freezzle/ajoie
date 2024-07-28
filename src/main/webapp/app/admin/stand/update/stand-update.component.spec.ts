import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, HttpResponse } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of, Subject, from } from 'rxjs';

import { IExponent } from 'app/entities/exponent/exponent.model';
import { ExponentService } from 'app/entities/exponent/service/exponent.service';
import { ISalon } from 'app/entities/salon/salon.model';
import { SalonService } from 'app/entities/salon/service/salon.service';
import { IDimensionStand } from 'app/entities/dimension-stand/dimension-stand.model';
import { DimensionStandService } from 'app/entities/dimension-stand/service/dimension-stand.service';
import { IStand } from '../stand.model';
import { StandService } from '../service/stand.service';
import { StandFormService } from './stand-form.service';

import { StandUpdateComponent } from './stand-update.component';

describe('Stand Management Update Component', () => {
  let comp: StandUpdateComponent;
  let fixture: ComponentFixture<StandUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let standFormService: StandFormService;
  let standService: StandService;
  let exponentService: ExponentService;
  let salonService: SalonService;
  let dimensionStandService: DimensionStandService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [StandUpdateComponent],
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
      .overrideTemplate(StandUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(StandUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    standFormService = TestBed.inject(StandFormService);
    standService = TestBed.inject(StandService);
    exponentService = TestBed.inject(ExponentService);
    salonService = TestBed.inject(SalonService);
    dimensionStandService = TestBed.inject(DimensionStandService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('Should call Exponent query and add missing value', () => {
      const stand: IStand = { id: '1361f429-3817-4123-8ee3-fdf8943310b2' };
      const exponent: IExponent = { id: '0e73fe47-371f-432d-a0b8-9df27910c5ea' };
      stand.exponent = exponent;

      const exponentCollection: IExponent[] = [{ id: '16ceac9b-311c-4e61-a06c-75befcb4496d' }];
      jest.spyOn(exponentService, 'query').mockReturnValue(of(new HttpResponse({ body: exponentCollection })));
      const additionalExponents = [exponent];
      const expectedCollection: IExponent[] = [...additionalExponents, ...exponentCollection];
      jest.spyOn(exponentService, 'addExponentToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ stand });
      comp.ngOnInit();

      expect(exponentService.query).toHaveBeenCalled();
      expect(exponentService.addExponentToCollectionIfMissing).toHaveBeenCalledWith(
        exponentCollection,
        ...additionalExponents.map(expect.objectContaining),
      );
      expect(comp.exponentsSharedCollection).toEqual(expectedCollection);
    });

    it('Should call Salon query and add missing value', () => {
      const stand: IStand = { id: '1361f429-3817-4123-8ee3-fdf8943310b2' };
      const salon: ISalon = { id: 'e23c2bc7-6456-4bc7-ba60-71193b0d3058' };
      stand.salon = salon;

      const salonCollection: ISalon[] = [{ id: '08e1ada4-aa75-4f3f-a09f-5d03bf897924' }];
      jest.spyOn(salonService, 'query').mockReturnValue(of(new HttpResponse({ body: salonCollection })));
      const additionalSalons = [salon];
      const expectedCollection: ISalon[] = [...additionalSalons, ...salonCollection];
      jest.spyOn(salonService, 'addSalonToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ stand });
      comp.ngOnInit();

      expect(salonService.query).toHaveBeenCalled();
      expect(salonService.addSalonToCollectionIfMissing).toHaveBeenCalledWith(
        salonCollection,
        ...additionalSalons.map(expect.objectContaining),
      );
      expect(comp.salonsSharedCollection).toEqual(expectedCollection);
    });

    it('Should call DimensionStand query and add missing value', () => {
      const stand: IStand = { id: '1361f429-3817-4123-8ee3-fdf8943310b2' };
      const dimension: IDimensionStand = { id: '76f6b04f-719f-403b-be4d-925a2c00d10e' };
      stand.dimension = dimension;

      const dimensionStandCollection: IDimensionStand[] = [{ id: '93a7c3c3-6dfa-4841-8114-fe03b1ba0cb8' }];
      jest.spyOn(dimensionStandService, 'query').mockReturnValue(of(new HttpResponse({ body: dimensionStandCollection })));
      const additionalDimensionStands = [dimension];
      const expectedCollection: IDimensionStand[] = [...additionalDimensionStands, ...dimensionStandCollection];
      jest.spyOn(dimensionStandService, 'addDimensionStandToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ stand });
      comp.ngOnInit();

      expect(dimensionStandService.query).toHaveBeenCalled();
      expect(dimensionStandService.addDimensionStandToCollectionIfMissing).toHaveBeenCalledWith(
        dimensionStandCollection,
        ...additionalDimensionStands.map(expect.objectContaining),
      );
      expect(comp.dimensionStandsSharedCollection).toEqual(expectedCollection);
    });

    it('Should update editForm', () => {
      const stand: IStand = { id: '1361f429-3817-4123-8ee3-fdf8943310b2' };
      const exponent: IExponent = { id: 'd60ec9d0-d751-4eec-899e-27bc1ef62471' };
      stand.exponent = exponent;
      const salon: ISalon = { id: '7ec64d34-2519-48a1-9fff-6cfdb59c4ba8' };
      stand.salon = salon;
      const dimension: IDimensionStand = { id: '3c81d381-ec4b-463b-9943-a4400f3d0d63' };
      stand.dimension = dimension;

      activatedRoute.data = of({ stand });
      comp.ngOnInit();

      expect(comp.exponentsSharedCollection).toContain(exponent);
      expect(comp.salonsSharedCollection).toContain(salon);
      expect(comp.dimensionStandsSharedCollection).toContain(dimension);
      expect(comp.stand).toEqual(stand);
    });
  });

  describe('save', () => {
    it('Should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IStand>>();
      const stand = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
      jest.spyOn(standFormService, 'getStand').mockReturnValue(stand);
      jest.spyOn(standService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ stand });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: stand }));
      saveSubject.complete();

      // THEN
      expect(standFormService.getStand).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(standService.update).toHaveBeenCalledWith(expect.objectContaining(stand));
      expect(comp.isSaving).toEqual(false);
    });

    it('Should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IStand>>();
      const stand = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
      jest.spyOn(standFormService, 'getStand').mockReturnValue({ id: null });
      jest.spyOn(standService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ stand: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: stand }));
      saveSubject.complete();

      // THEN
      expect(standFormService.getStand).toHaveBeenCalled();
      expect(standService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('Should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IStand>>();
      const stand = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
      jest.spyOn(standService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ stand });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(standService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });

  describe('Compare relationships', () => {
    describe('compareExponent', () => {
      it('Should forward to exponentService', () => {
        const entity = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
        const entity2 = { id: '1361f429-3817-4123-8ee3-fdf8943310b2' };
        jest.spyOn(exponentService, 'compareExponent');
        comp.compareExponent(entity, entity2);
        expect(exponentService.compareExponent).toHaveBeenCalledWith(entity, entity2);
      });
    });

    describe('compareSalon', () => {
      it('Should forward to salonService', () => {
        const entity = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
        const entity2 = { id: '1361f429-3817-4123-8ee3-fdf8943310b2' };
        jest.spyOn(salonService, 'compareSalon');
        comp.compareSalon(entity, entity2);
        expect(salonService.compareSalon).toHaveBeenCalledWith(entity, entity2);
      });
    });

    describe('compareDimensionStand', () => {
      it('Should forward to dimensionStandService', () => {
        const entity = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
        const entity2 = { id: '1361f429-3817-4123-8ee3-fdf8943310b2' };
        jest.spyOn(dimensionStandService, 'compareDimensionStand');
        comp.compareDimensionStand(entity, entity2);
        expect(dimensionStandService.compareDimensionStand).toHaveBeenCalledWith(entity, entity2);
      });
    });
  });
});
