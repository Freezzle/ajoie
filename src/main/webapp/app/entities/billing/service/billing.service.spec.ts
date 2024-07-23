import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { IBilling } from '../billing.model';
import { sampleWithRequiredData, sampleWithNewData, sampleWithPartialData, sampleWithFullData } from '../billing.test-samples';

import { BillingService } from './billing.service';

const requireRestSample: IBilling = {
  ...sampleWithRequiredData,
};

describe('Billing Service', () => {
  let service: BillingService;
  let httpMock: HttpTestingController;
  let expectedResult: IBilling | IBilling[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    expectedResult = null;
    service = TestBed.inject(BillingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  describe('Service methods', () => {
    it('should find an element', () => {
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.find('9fec3727-3421-4967-b213-ba36557ca194').subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should create a Billing', () => {
      const billing = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(billing).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a Billing', () => {
      const billing = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(billing).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a Billing', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of Billing', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a Billing', () => {
      const expected = true;

      service.delete('9fec3727-3421-4967-b213-ba36557ca194').subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addBillingToCollectionIfMissing', () => {
      it('should add a Billing to an empty array', () => {
        const billing: IBilling = sampleWithRequiredData;
        expectedResult = service.addBillingToCollectionIfMissing([], billing);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(billing);
      });

      it('should not add a Billing to an array that contains it', () => {
        const billing: IBilling = sampleWithRequiredData;
        const billingCollection: IBilling[] = [
          {
            ...billing,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addBillingToCollectionIfMissing(billingCollection, billing);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a Billing to an array that doesn't contain it", () => {
        const billing: IBilling = sampleWithRequiredData;
        const billingCollection: IBilling[] = [sampleWithPartialData];
        expectedResult = service.addBillingToCollectionIfMissing(billingCollection, billing);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(billing);
      });

      it('should add only unique Billing to an array', () => {
        const billingArray: IBilling[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const billingCollection: IBilling[] = [sampleWithRequiredData];
        expectedResult = service.addBillingToCollectionIfMissing(billingCollection, ...billingArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const billing: IBilling = sampleWithRequiredData;
        const billing2: IBilling = sampleWithPartialData;
        expectedResult = service.addBillingToCollectionIfMissing([], billing, billing2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(billing);
        expect(expectedResult).toContain(billing2);
      });

      it('should accept null and undefined values', () => {
        const billing: IBilling = sampleWithRequiredData;
        expectedResult = service.addBillingToCollectionIfMissing([], null, billing, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(billing);
      });

      it('should return initial array if no Billing is added', () => {
        const billingCollection: IBilling[] = [sampleWithRequiredData];
        expectedResult = service.addBillingToCollectionIfMissing(billingCollection, undefined, null);
        expect(expectedResult).toEqual(billingCollection);
      });
    });

    describe('compareBilling', () => {
      it('Should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.compareBilling(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('Should return false if one entity is null', () => {
        const entity1 = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
        const entity2 = null;

        const compareResult1 = service.compareBilling(entity1, entity2);
        const compareResult2 = service.compareBilling(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey differs', () => {
        const entity1 = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
        const entity2 = { id: '1361f429-3817-4123-8ee3-fdf8943310b2' };

        const compareResult1 = service.compareBilling(entity1, entity2);
        const compareResult2 = service.compareBilling(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey matches', () => {
        const entity1 = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
        const entity2 = { id: '9fec3727-3421-4967-b213-ba36557ca194' };

        const compareResult1 = service.compareBilling(entity1, entity2);
        const compareResult2 = service.compareBilling(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
