import { TestBed } from '@angular/core/testing';

import { sampleWithRequiredData, sampleWithNewData } from '../stand.test-samples';

import { StandFormService } from './stand-form.service';

describe('Stand Form Service', () => {
  let service: StandFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StandFormService);
  });

  describe('Service methods', () => {
    describe('createStandFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createStandFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            description: expect.any(Object),
            nbMeal1: expect.any(Object),
            nbMeal2: expect.any(Object),
            nbMeal3: expect.any(Object),
            shared: expect.any(Object),
            nbTable: expect.any(Object),
            nbChair: expect.any(Object),
            needElectricity: expect.any(Object),
            acceptedChart: expect.any(Object),
            exponent: expect.any(Object),
            salon: expect.any(Object),
            dimension: expect.any(Object),
          }),
        );
      });

      it('passing IStand should create a new form with FormGroup', () => {
        const formGroup = service.createStandFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            description: expect.any(Object),
            nbMeal1: expect.any(Object),
            nbMeal2: expect.any(Object),
            nbMeal3: expect.any(Object),
            shared: expect.any(Object),
            nbTable: expect.any(Object),
            nbChair: expect.any(Object),
            needElectricity: expect.any(Object),
            acceptedChart: expect.any(Object),
            exponent: expect.any(Object),
            salon: expect.any(Object),
            dimension: expect.any(Object),
          }),
        );
      });
    });

    describe('getStand', () => {
      it('should return NewStand for default Stand initial value', () => {
        const formGroup = service.createStandFormGroup(sampleWithNewData);

        const stand = service.getStand(formGroup) as any;

        expect(stand).toMatchObject(sampleWithNewData);
      });

      it('should return NewStand for empty Stand initial value', () => {
        const formGroup = service.createStandFormGroup();

        const stand = service.getStand(formGroup) as any;

        expect(stand).toMatchObject({});
      });

      it('should return IStand', () => {
        const formGroup = service.createStandFormGroup(sampleWithRequiredData);

        const stand = service.getStand(formGroup) as any;

        expect(stand).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing IStand should not enable id FormControl', () => {
        const formGroup = service.createStandFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewStand should disable id FormControl', () => {
        const formGroup = service.createStandFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
