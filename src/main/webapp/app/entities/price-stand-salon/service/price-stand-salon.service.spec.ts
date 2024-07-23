import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { IPriceStandSalon } from '../price-stand-salon.model';
import { sampleWithRequiredData, sampleWithNewData, sampleWithPartialData, sampleWithFullData } from '../price-stand-salon.test-samples';

import { PriceStandSalonService } from './price-stand-salon.service';

const requireRestSample: IPriceStandSalon = {
  ...sampleWithRequiredData,
};

describe('PriceStandSalon Service', () => {
  let service: PriceStandSalonService;
  let httpMock: HttpTestingController;
  let expectedResult: IPriceStandSalon | IPriceStandSalon[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    expectedResult = null;
    service = TestBed.inject(PriceStandSalonService);
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

    it('should create a PriceStandSalon', () => {
      const priceStandSalon = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(priceStandSalon).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a PriceStandSalon', () => {
      const priceStandSalon = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(priceStandSalon).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a PriceStandSalon', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of PriceStandSalon', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a PriceStandSalon', () => {
      const expected = true;

      service.delete('9fec3727-3421-4967-b213-ba36557ca194').subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addPriceStandSalonToCollectionIfMissing', () => {
      it('should add a PriceStandSalon to an empty array', () => {
        const priceStandSalon: IPriceStandSalon = sampleWithRequiredData;
        expectedResult = service.addPriceStandSalonToCollectionIfMissing([], priceStandSalon);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(priceStandSalon);
      });

      it('should not add a PriceStandSalon to an array that contains it', () => {
        const priceStandSalon: IPriceStandSalon = sampleWithRequiredData;
        const priceStandSalonCollection: IPriceStandSalon[] = [
          {
            ...priceStandSalon,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addPriceStandSalonToCollectionIfMissing(priceStandSalonCollection, priceStandSalon);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a PriceStandSalon to an array that doesn't contain it", () => {
        const priceStandSalon: IPriceStandSalon = sampleWithRequiredData;
        const priceStandSalonCollection: IPriceStandSalon[] = [sampleWithPartialData];
        expectedResult = service.addPriceStandSalonToCollectionIfMissing(priceStandSalonCollection, priceStandSalon);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(priceStandSalon);
      });

      it('should add only unique PriceStandSalon to an array', () => {
        const priceStandSalonArray: IPriceStandSalon[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const priceStandSalonCollection: IPriceStandSalon[] = [sampleWithRequiredData];
        expectedResult = service.addPriceStandSalonToCollectionIfMissing(priceStandSalonCollection, ...priceStandSalonArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const priceStandSalon: IPriceStandSalon = sampleWithRequiredData;
        const priceStandSalon2: IPriceStandSalon = sampleWithPartialData;
        expectedResult = service.addPriceStandSalonToCollectionIfMissing([], priceStandSalon, priceStandSalon2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(priceStandSalon);
        expect(expectedResult).toContain(priceStandSalon2);
      });

      it('should accept null and undefined values', () => {
        const priceStandSalon: IPriceStandSalon = sampleWithRequiredData;
        expectedResult = service.addPriceStandSalonToCollectionIfMissing([], null, priceStandSalon, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(priceStandSalon);
      });

      it('should return initial array if no PriceStandSalon is added', () => {
        const priceStandSalonCollection: IPriceStandSalon[] = [sampleWithRequiredData];
        expectedResult = service.addPriceStandSalonToCollectionIfMissing(priceStandSalonCollection, undefined, null);
        expect(expectedResult).toEqual(priceStandSalonCollection);
      });
    });

    describe('comparePriceStandSalon', () => {
      it('Should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.comparePriceStandSalon(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('Should return false if one entity is null', () => {
        const entity1 = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
        const entity2 = null;

        const compareResult1 = service.comparePriceStandSalon(entity1, entity2);
        const compareResult2 = service.comparePriceStandSalon(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey differs', () => {
        const entity1 = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
        const entity2 = { id: '1361f429-3817-4123-8ee3-fdf8943310b2' };

        const compareResult1 = service.comparePriceStandSalon(entity1, entity2);
        const compareResult2 = service.comparePriceStandSalon(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey matches', () => {
        const entity1 = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
        const entity2 = { id: '9fec3727-3421-4967-b213-ba36557ca194' };

        const compareResult1 = service.comparePriceStandSalon(entity1, entity2);
        const compareResult2 = service.comparePriceStandSalon(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
