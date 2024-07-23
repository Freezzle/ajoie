import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, HttpResponse } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of, Subject, from } from 'rxjs';

import { IDimensionStand } from 'app/entities/dimension-stand/dimension-stand.model';
import { DimensionStandService } from 'app/entities/dimension-stand/service/dimension-stand.service';
import { ISalon } from 'app/entities/salon/salon.model';
import { SalonService } from 'app/entities/salon/service/salon.service';
import { IPriceStandSalon } from '../price-stand-salon.model';
import { PriceStandSalonService } from '../service/price-stand-salon.service';
import { PriceStandSalonFormService } from './price-stand-salon-form.service';

import { PriceStandSalonUpdateComponent } from './price-stand-salon-update.component';

describe('PriceStandSalon Management Update Component', () => {
  let comp: PriceStandSalonUpdateComponent;
  let fixture: ComponentFixture<PriceStandSalonUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let priceStandSalonFormService: PriceStandSalonFormService;
  let priceStandSalonService: PriceStandSalonService;
  let dimensionStandService: DimensionStandService;
  let salonService: SalonService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PriceStandSalonUpdateComponent],
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
      .overrideTemplate(PriceStandSalonUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(PriceStandSalonUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    priceStandSalonFormService = TestBed.inject(PriceStandSalonFormService);
    priceStandSalonService = TestBed.inject(PriceStandSalonService);
    dimensionStandService = TestBed.inject(DimensionStandService);
    salonService = TestBed.inject(SalonService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('Should call DimensionStand query and add missing value', () => {
      const priceStandSalon: IPriceStandSalon = { id: '1361f429-3817-4123-8ee3-fdf8943310b2' };
      const dimension: IDimensionStand = { id: '8c0e562b-1939-4192-a509-77c5463343a7' };
      priceStandSalon.dimension = dimension;

      const dimensionStandCollection: IDimensionStand[] = [{ id: '605dfdda-73c6-40f8-a43d-aa26f3c375b1' }];
      jest.spyOn(dimensionStandService, 'query').mockReturnValue(of(new HttpResponse({ body: dimensionStandCollection })));
      const additionalDimensionStands = [dimension];
      const expectedCollection: IDimensionStand[] = [...additionalDimensionStands, ...dimensionStandCollection];
      jest.spyOn(dimensionStandService, 'addDimensionStandToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ priceStandSalon });
      comp.ngOnInit();

      expect(dimensionStandService.query).toHaveBeenCalled();
      expect(dimensionStandService.addDimensionStandToCollectionIfMissing).toHaveBeenCalledWith(
        dimensionStandCollection,
        ...additionalDimensionStands.map(expect.objectContaining),
      );
      expect(comp.dimensionStandsSharedCollection).toEqual(expectedCollection);
    });

    it('Should call Salon query and add missing value', () => {
      const priceStandSalon: IPriceStandSalon = { id: '1361f429-3817-4123-8ee3-fdf8943310b2' };
      const salon: ISalon = { id: 'f9ba4596-d795-4ccf-8d91-1e03dc8756b6' };
      priceStandSalon.salon = salon;

      const salonCollection: ISalon[] = [{ id: '7da74449-0548-4918-aa7a-e53173794a82' }];
      jest.spyOn(salonService, 'query').mockReturnValue(of(new HttpResponse({ body: salonCollection })));
      const additionalSalons = [salon];
      const expectedCollection: ISalon[] = [...additionalSalons, ...salonCollection];
      jest.spyOn(salonService, 'addSalonToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ priceStandSalon });
      comp.ngOnInit();

      expect(salonService.query).toHaveBeenCalled();
      expect(salonService.addSalonToCollectionIfMissing).toHaveBeenCalledWith(
        salonCollection,
        ...additionalSalons.map(expect.objectContaining),
      );
      expect(comp.salonsSharedCollection).toEqual(expectedCollection);
    });

    it('Should update editForm', () => {
      const priceStandSalon: IPriceStandSalon = { id: '1361f429-3817-4123-8ee3-fdf8943310b2' };
      const dimension: IDimensionStand = { id: '75e397d7-81b7-4e5e-9b8a-2b136639d210' };
      priceStandSalon.dimension = dimension;
      const salon: ISalon = { id: '24063d06-0bf6-43c0-a458-93636e928b00' };
      priceStandSalon.salon = salon;

      activatedRoute.data = of({ priceStandSalon });
      comp.ngOnInit();

      expect(comp.dimensionStandsSharedCollection).toContain(dimension);
      expect(comp.salonsSharedCollection).toContain(salon);
      expect(comp.priceStandSalon).toEqual(priceStandSalon);
    });
  });

  describe('save', () => {
    it('Should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IPriceStandSalon>>();
      const priceStandSalon = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
      jest.spyOn(priceStandSalonFormService, 'getPriceStandSalon').mockReturnValue(priceStandSalon);
      jest.spyOn(priceStandSalonService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ priceStandSalon });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: priceStandSalon }));
      saveSubject.complete();

      // THEN
      expect(priceStandSalonFormService.getPriceStandSalon).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(priceStandSalonService.update).toHaveBeenCalledWith(expect.objectContaining(priceStandSalon));
      expect(comp.isSaving).toEqual(false);
    });

    it('Should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IPriceStandSalon>>();
      const priceStandSalon = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
      jest.spyOn(priceStandSalonFormService, 'getPriceStandSalon').mockReturnValue({ id: null });
      jest.spyOn(priceStandSalonService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ priceStandSalon: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: priceStandSalon }));
      saveSubject.complete();

      // THEN
      expect(priceStandSalonFormService.getPriceStandSalon).toHaveBeenCalled();
      expect(priceStandSalonService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('Should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IPriceStandSalon>>();
      const priceStandSalon = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
      jest.spyOn(priceStandSalonService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ priceStandSalon });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(priceStandSalonService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });

  describe('Compare relationships', () => {
    describe('compareDimensionStand', () => {
      it('Should forward to dimensionStandService', () => {
        const entity = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
        const entity2 = { id: '1361f429-3817-4123-8ee3-fdf8943310b2' };
        jest.spyOn(dimensionStandService, 'compareDimensionStand');
        comp.compareDimensionStand(entity, entity2);
        expect(dimensionStandService.compareDimensionStand).toHaveBeenCalledWith(entity, entity2);
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
  });
});
