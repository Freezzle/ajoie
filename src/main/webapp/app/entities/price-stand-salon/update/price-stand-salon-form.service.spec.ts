import { TestBed } from '@angular/core/testing';

import { sampleWithRequiredData, sampleWithNewData } from '../price-stand-salon.test-samples';

import { PriceStandSalonFormService } from './price-stand-salon-form.service';

describe('PriceStandSalon Form Service', () => {
  let service: PriceStandSalonFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PriceStandSalonFormService);
  });

  describe('Service methods', () => {
    describe('createPriceStandSalonFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createPriceStandSalonFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            price: expect.any(Object),
            dimension: expect.any(Object),
            salon: expect.any(Object),
          }),
        );
      });

      it('passing IPriceStandSalon should create a new form with FormGroup', () => {
        const formGroup = service.createPriceStandSalonFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            price: expect.any(Object),
            dimension: expect.any(Object),
            salon: expect.any(Object),
          }),
        );
      });
    });

    describe('getPriceStandSalon', () => {
      it('should return NewPriceStandSalon for default PriceStandSalon initial value', () => {
        const formGroup = service.createPriceStandSalonFormGroup(sampleWithNewData);

        const priceStandSalon = service.getPriceStandSalon(formGroup) as any;

        expect(priceStandSalon).toMatchObject(sampleWithNewData);
      });

      it('should return NewPriceStandSalon for empty PriceStandSalon initial value', () => {
        const formGroup = service.createPriceStandSalonFormGroup();

        const priceStandSalon = service.getPriceStandSalon(formGroup) as any;

        expect(priceStandSalon).toMatchObject({});
      });

      it('should return IPriceStandSalon', () => {
        const formGroup = service.createPriceStandSalonFormGroup(sampleWithRequiredData);

        const priceStandSalon = service.getPriceStandSalon(formGroup) as any;

        expect(priceStandSalon).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing IPriceStandSalon should not enable id FormControl', () => {
        const formGroup = service.createPriceStandSalonFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewPriceStandSalon should disable id FormControl', () => {
        const formGroup = service.createPriceStandSalonFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
