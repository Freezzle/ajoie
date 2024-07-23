import { TestBed } from '@angular/core/testing';

import { sampleWithRequiredData, sampleWithNewData } from '../billing.test-samples';

import { BillingFormService } from './billing-form.service';

describe('Billing Form Service', () => {
  let service: BillingFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BillingFormService);
  });

  describe('Service methods', () => {
    describe('createBillingFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createBillingFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            acceptedContract: expect.any(Object),
            needArrangment: expect.any(Object),
            isClosed: expect.any(Object),
            stand: expect.any(Object),
          }),
        );
      });

      it('passing IBilling should create a new form with FormGroup', () => {
        const formGroup = service.createBillingFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            acceptedContract: expect.any(Object),
            needArrangment: expect.any(Object),
            isClosed: expect.any(Object),
            stand: expect.any(Object),
          }),
        );
      });
    });

    describe('getBilling', () => {
      it('should return NewBilling for default Billing initial value', () => {
        const formGroup = service.createBillingFormGroup(sampleWithNewData);

        const billing = service.getBilling(formGroup) as any;

        expect(billing).toMatchObject(sampleWithNewData);
      });

      it('should return NewBilling for empty Billing initial value', () => {
        const formGroup = service.createBillingFormGroup();

        const billing = service.getBilling(formGroup) as any;

        expect(billing).toMatchObject({});
      });

      it('should return IBilling', () => {
        const formGroup = service.createBillingFormGroup(sampleWithRequiredData);

        const billing = service.getBilling(formGroup) as any;

        expect(billing).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing IBilling should not enable id FormControl', () => {
        const formGroup = service.createBillingFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewBilling should disable id FormControl', () => {
        const formGroup = service.createBillingFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
