import { TestBed } from '@angular/core/testing';

import { sampleWithRequiredData, sampleWithNewData } from '../dimension-stand.test-samples';

import { DimensionStandFormService } from './dimension-stand-form.service';

describe('DimensionStand Form Service', () => {
  let service: DimensionStandFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DimensionStandFormService);
  });

  describe('Service methods', () => {
    describe('createDimensionStandFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createDimensionStandFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            dimension: expect.any(Object),
          }),
        );
      });

      it('passing IDimensionStand should create a new form with FormGroup', () => {
        const formGroup = service.createDimensionStandFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            dimension: expect.any(Object),
          }),
        );
      });
    });

    describe('getDimensionStand', () => {
      it('should return NewDimensionStand for default DimensionStand initial value', () => {
        const formGroup = service.createDimensionStandFormGroup(sampleWithNewData);

        const dimensionStand = service.getDimensionStand(formGroup) as any;

        expect(dimensionStand).toMatchObject(sampleWithNewData);
      });

      it('should return NewDimensionStand for empty DimensionStand initial value', () => {
        const formGroup = service.createDimensionStandFormGroup();

        const dimensionStand = service.getDimensionStand(formGroup) as any;

        expect(dimensionStand).toMatchObject({});
      });

      it('should return IDimensionStand', () => {
        const formGroup = service.createDimensionStandFormGroup(sampleWithRequiredData);

        const dimensionStand = service.getDimensionStand(formGroup) as any;

        expect(dimensionStand).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing IDimensionStand should not enable id FormControl', () => {
        const formGroup = service.createDimensionStandFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewDimensionStand should disable id FormControl', () => {
        const formGroup = service.createDimensionStandFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
