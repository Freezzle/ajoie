import { TestBed } from '@angular/core/testing';

import { sampleWithRequiredData, sampleWithNewData } from '../configuration-salon.test-samples';

import { ConfigurationSalonFormService } from './configuration-salon-form.service';

describe('ConfigurationSalon Form Service', () => {
  let service: ConfigurationSalonFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfigurationSalonFormService);
  });

  describe('Service methods', () => {
    describe('createConfigurationSalonFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createConfigurationSalonFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            priceMeal1: expect.any(Object),
            priceMeal2: expect.any(Object),
            priceMeal3: expect.any(Object),
            priceConference: expect.any(Object),
            priceSharingStand: expect.any(Object),
            salon: expect.any(Object),
          }),
        );
      });

      it('passing IConfigurationSalon should create a new form with FormGroup', () => {
        const formGroup = service.createConfigurationSalonFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            priceMeal1: expect.any(Object),
            priceMeal2: expect.any(Object),
            priceMeal3: expect.any(Object),
            priceConference: expect.any(Object),
            priceSharingStand: expect.any(Object),
            salon: expect.any(Object),
          }),
        );
      });
    });

    describe('getConfigurationSalon', () => {
      it('should return NewConfigurationSalon for default ConfigurationSalon initial value', () => {
        const formGroup = service.createConfigurationSalonFormGroup(sampleWithNewData);

        const configurationSalon = service.getConfigurationSalon(formGroup) as any;

        expect(configurationSalon).toMatchObject(sampleWithNewData);
      });

      it('should return NewConfigurationSalon for empty ConfigurationSalon initial value', () => {
        const formGroup = service.createConfigurationSalonFormGroup();

        const configurationSalon = service.getConfigurationSalon(formGroup) as any;

        expect(configurationSalon).toMatchObject({});
      });

      it('should return IConfigurationSalon', () => {
        const formGroup = service.createConfigurationSalonFormGroup(sampleWithRequiredData);

        const configurationSalon = service.getConfigurationSalon(formGroup) as any;

        expect(configurationSalon).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing IConfigurationSalon should not enable id FormControl', () => {
        const formGroup = service.createConfigurationSalonFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewConfigurationSalon should disable id FormControl', () => {
        const formGroup = service.createConfigurationSalonFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
