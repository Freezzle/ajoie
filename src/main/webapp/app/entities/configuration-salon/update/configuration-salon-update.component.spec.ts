import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, HttpResponse } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of, Subject, from } from 'rxjs';

import { ISalon } from 'app/entities/salon/salon.model';
import { SalonService } from 'app/entities/salon/service/salon.service';
import { ConfigurationSalonService } from '../service/configuration-salon.service';
import { IConfigurationSalon } from '../configuration-salon.model';
import { ConfigurationSalonFormService } from './configuration-salon-form.service';

import { ConfigurationSalonUpdateComponent } from './configuration-salon-update.component';

describe('ConfigurationSalon Management Update Component', () => {
  let comp: ConfigurationSalonUpdateComponent;
  let fixture: ComponentFixture<ConfigurationSalonUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let configurationSalonFormService: ConfigurationSalonFormService;
  let configurationSalonService: ConfigurationSalonService;
  let salonService: SalonService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ConfigurationSalonUpdateComponent],
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
      .overrideTemplate(ConfigurationSalonUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(ConfigurationSalonUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    configurationSalonFormService = TestBed.inject(ConfigurationSalonFormService);
    configurationSalonService = TestBed.inject(ConfigurationSalonService);
    salonService = TestBed.inject(SalonService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('Should call salon query and add missing value', () => {
      const configurationSalon: IConfigurationSalon = { id: '1361f429-3817-4123-8ee3-fdf8943310b2' };
      const salon: ISalon = { id: '32be38ab-5d7e-4e87-be68-8a07e55c5d6f' };
      configurationSalon.salon = salon;

      const salonCollection: ISalon[] = [{ id: 'b3994b16-89c3-402f-8298-734ec4f1ca2f' }];
      jest.spyOn(salonService, 'query').mockReturnValue(of(new HttpResponse({ body: salonCollection })));
      const expectedCollection: ISalon[] = [salon, ...salonCollection];
      jest.spyOn(salonService, 'addSalonToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ configurationSalon });
      comp.ngOnInit();

      expect(salonService.query).toHaveBeenCalled();
      expect(salonService.addSalonToCollectionIfMissing).toHaveBeenCalledWith(salonCollection, salon);
      expect(comp.salonsCollection).toEqual(expectedCollection);
    });

    it('Should update editForm', () => {
      const configurationSalon: IConfigurationSalon = { id: '1361f429-3817-4123-8ee3-fdf8943310b2' };
      const salon: ISalon = { id: '97aecf17-8e54-4164-a7ce-74b1a3c966d9' };
      configurationSalon.salon = salon;

      activatedRoute.data = of({ configurationSalon });
      comp.ngOnInit();

      expect(comp.salonsCollection).toContain(salon);
      expect(comp.configurationSalon).toEqual(configurationSalon);
    });
  });

  describe('save', () => {
    it('Should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IConfigurationSalon>>();
      const configurationSalon = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
      jest.spyOn(configurationSalonFormService, 'getConfigurationSalon').mockReturnValue(configurationSalon);
      jest.spyOn(configurationSalonService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ configurationSalon });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: configurationSalon }));
      saveSubject.complete();

      // THEN
      expect(configurationSalonFormService.getConfigurationSalon).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(configurationSalonService.update).toHaveBeenCalledWith(expect.objectContaining(configurationSalon));
      expect(comp.isSaving).toEqual(false);
    });

    it('Should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IConfigurationSalon>>();
      const configurationSalon = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
      jest.spyOn(configurationSalonFormService, 'getConfigurationSalon').mockReturnValue({ id: null });
      jest.spyOn(configurationSalonService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ configurationSalon: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: configurationSalon }));
      saveSubject.complete();

      // THEN
      expect(configurationSalonFormService.getConfigurationSalon).toHaveBeenCalled();
      expect(configurationSalonService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('Should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IConfigurationSalon>>();
      const configurationSalon = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
      jest.spyOn(configurationSalonService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ configurationSalon });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(configurationSalonService.update).toHaveBeenCalled();
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
  });
});
