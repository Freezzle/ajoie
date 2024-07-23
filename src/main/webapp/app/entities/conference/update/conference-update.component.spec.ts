import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, HttpResponse } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of, Subject, from } from 'rxjs';

import { ISalon } from 'app/entities/salon/salon.model';
import { SalonService } from 'app/entities/salon/service/salon.service';
import { IExponent } from 'app/entities/exponent/exponent.model';
import { ExponentService } from 'app/entities/exponent/service/exponent.service';
import { IConference } from '../conference.model';
import { ConferenceService } from '../service/conference.service';
import { ConferenceFormService } from './conference-form.service';

import { ConferenceUpdateComponent } from './conference-update.component';

describe('Conference Management Update Component', () => {
  let comp: ConferenceUpdateComponent;
  let fixture: ComponentFixture<ConferenceUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let conferenceFormService: ConferenceFormService;
  let conferenceService: ConferenceService;
  let salonService: SalonService;
  let exponentService: ExponentService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ConferenceUpdateComponent],
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
      .overrideTemplate(ConferenceUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(ConferenceUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    conferenceFormService = TestBed.inject(ConferenceFormService);
    conferenceService = TestBed.inject(ConferenceService);
    salonService = TestBed.inject(SalonService);
    exponentService = TestBed.inject(ExponentService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('Should call Salon query and add missing value', () => {
      const conference: IConference = { id: '1361f429-3817-4123-8ee3-fdf8943310b2' };
      const salon: ISalon = { id: '2c4ca7dd-ef06-4acb-978f-ade416bfff2a' };
      conference.salon = salon;

      const salonCollection: ISalon[] = [{ id: 'f4597a81-a844-4fc3-85d4-286173c12300' }];
      jest.spyOn(salonService, 'query').mockReturnValue(of(new HttpResponse({ body: salonCollection })));
      const additionalSalons = [salon];
      const expectedCollection: ISalon[] = [...additionalSalons, ...salonCollection];
      jest.spyOn(salonService, 'addSalonToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ conference });
      comp.ngOnInit();

      expect(salonService.query).toHaveBeenCalled();
      expect(salonService.addSalonToCollectionIfMissing).toHaveBeenCalledWith(
        salonCollection,
        ...additionalSalons.map(expect.objectContaining),
      );
      expect(comp.salonsSharedCollection).toEqual(expectedCollection);
    });

    it('Should call Exponent query and add missing value', () => {
      const conference: IConference = { id: '1361f429-3817-4123-8ee3-fdf8943310b2' };
      const exponent: IExponent = { id: '6ba93563-a68c-4e49-8bec-19b738dc7d9e' };
      conference.exponent = exponent;

      const exponentCollection: IExponent[] = [{ id: 'a40f97e4-6d2a-42b2-9316-43353cc39a6b' }];
      jest.spyOn(exponentService, 'query').mockReturnValue(of(new HttpResponse({ body: exponentCollection })));
      const additionalExponents = [exponent];
      const expectedCollection: IExponent[] = [...additionalExponents, ...exponentCollection];
      jest.spyOn(exponentService, 'addExponentToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ conference });
      comp.ngOnInit();

      expect(exponentService.query).toHaveBeenCalled();
      expect(exponentService.addExponentToCollectionIfMissing).toHaveBeenCalledWith(
        exponentCollection,
        ...additionalExponents.map(expect.objectContaining),
      );
      expect(comp.exponentsSharedCollection).toEqual(expectedCollection);
    });

    it('Should update editForm', () => {
      const conference: IConference = { id: '1361f429-3817-4123-8ee3-fdf8943310b2' };
      const salon: ISalon = { id: '0270b654-f3dc-4cfd-99c4-105cae2efde1' };
      conference.salon = salon;
      const exponent: IExponent = { id: 'e57c43da-bc63-4d82-bb71-57048d4023d6' };
      conference.exponent = exponent;

      activatedRoute.data = of({ conference });
      comp.ngOnInit();

      expect(comp.salonsSharedCollection).toContain(salon);
      expect(comp.exponentsSharedCollection).toContain(exponent);
      expect(comp.conference).toEqual(conference);
    });
  });

  describe('save', () => {
    it('Should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IConference>>();
      const conference = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
      jest.spyOn(conferenceFormService, 'getConference').mockReturnValue(conference);
      jest.spyOn(conferenceService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ conference });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: conference }));
      saveSubject.complete();

      // THEN
      expect(conferenceFormService.getConference).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(conferenceService.update).toHaveBeenCalledWith(expect.objectContaining(conference));
      expect(comp.isSaving).toEqual(false);
    });

    it('Should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IConference>>();
      const conference = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
      jest.spyOn(conferenceFormService, 'getConference').mockReturnValue({ id: null });
      jest.spyOn(conferenceService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ conference: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: conference }));
      saveSubject.complete();

      // THEN
      expect(conferenceFormService.getConference).toHaveBeenCalled();
      expect(conferenceService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('Should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IConference>>();
      const conference = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
      jest.spyOn(conferenceService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ conference });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(conferenceService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });

  describe('Compare relationships', () => {
    describe('compareSalon', () => {
      it('Should forward to salonService', () => {
        const entity = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
        const entity2 = { id: '1361f429-3817-4123-8ee3-fdf8943310b2' };
        jest.spyOn(salonService, 'compareSalon');
        comp.compareSalon(entity, entity2);
        expect(salonService.compareSalon).toHaveBeenCalledWith(entity, entity2);
      });
    });

    describe('compareExponent', () => {
      it('Should forward to exponentService', () => {
        const entity = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
        const entity2 = { id: '1361f429-3817-4123-8ee3-fdf8943310b2' };
        jest.spyOn(exponentService, 'compareExponent');
        comp.compareExponent(entity, entity2);
        expect(exponentService.compareExponent).toHaveBeenCalledWith(entity, entity2);
      });
    });
  });
});
