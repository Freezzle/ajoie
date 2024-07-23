import { TestBed } from '@angular/core/testing';

import { sampleWithRequiredData, sampleWithNewData } from '../exponent.test-samples';

import { ExponentFormService } from './exponent-form.service';

describe('Exponent Form Service', () => {
  let service: ExponentFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExponentFormService);
  });

  describe('Service methods', () => {
    describe('createExponentFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createExponentFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            email: expect.any(Object),
            fullName: expect.any(Object),
            phoneNumber: expect.any(Object),
            website: expect.any(Object),
            socialMedia: expect.any(Object),
            address: expect.any(Object),
            npaLocalite: expect.any(Object),
            urlPicture: expect.any(Object),
            comment: expect.any(Object),
            blocked: expect.any(Object),
          }),
        );
      });

      it('passing IExponent should create a new form with FormGroup', () => {
        const formGroup = service.createExponentFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            email: expect.any(Object),
            fullName: expect.any(Object),
            phoneNumber: expect.any(Object),
            website: expect.any(Object),
            socialMedia: expect.any(Object),
            address: expect.any(Object),
            npaLocalite: expect.any(Object),
            urlPicture: expect.any(Object),
            comment: expect.any(Object),
            blocked: expect.any(Object),
          }),
        );
      });
    });

    describe('getExponent', () => {
      it('should return NewExponent for default Exponent initial value', () => {
        const formGroup = service.createExponentFormGroup(sampleWithNewData);

        const exponent = service.getExponent(formGroup) as any;

        expect(exponent).toMatchObject(sampleWithNewData);
      });

      it('should return NewExponent for empty Exponent initial value', () => {
        const formGroup = service.createExponentFormGroup();

        const exponent = service.getExponent(formGroup) as any;

        expect(exponent).toMatchObject({});
      });

      it('should return IExponent', () => {
        const formGroup = service.createExponentFormGroup(sampleWithRequiredData);

        const exponent = service.getExponent(formGroup) as any;

        expect(exponent).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing IExponent should not enable id FormControl', () => {
        const formGroup = service.createExponentFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewExponent should disable id FormControl', () => {
        const formGroup = service.createExponentFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
