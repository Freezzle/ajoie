import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { IDimensionStand } from '../dimension-stand.model';
import { sampleWithRequiredData, sampleWithNewData, sampleWithPartialData, sampleWithFullData } from '../dimension-stand.test-samples';

import { DimensionStandService } from './dimension-stand.service';

const requireRestSample: IDimensionStand = {
  ...sampleWithRequiredData,
};

describe('DimensionStand Service', () => {
  let service: DimensionStandService;
  let httpMock: HttpTestingController;
  let expectedResult: IDimensionStand | IDimensionStand[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    expectedResult = null;
    service = TestBed.inject(DimensionStandService);
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

    it('should create a DimensionStand', () => {
      const dimensionStand = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(dimensionStand).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a DimensionStand', () => {
      const dimensionStand = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(dimensionStand).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a DimensionStand', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of DimensionStand', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a DimensionStand', () => {
      const expected = true;

      service.delete('9fec3727-3421-4967-b213-ba36557ca194').subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addDimensionStandToCollectionIfMissing', () => {
      it('should add a DimensionStand to an empty array', () => {
        const dimensionStand: IDimensionStand = sampleWithRequiredData;
        expectedResult = service.addDimensionStandToCollectionIfMissing([], dimensionStand);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(dimensionStand);
      });

      it('should not add a DimensionStand to an array that contains it', () => {
        const dimensionStand: IDimensionStand = sampleWithRequiredData;
        const dimensionStandCollection: IDimensionStand[] = [
          {
            ...dimensionStand,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addDimensionStandToCollectionIfMissing(dimensionStandCollection, dimensionStand);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a DimensionStand to an array that doesn't contain it", () => {
        const dimensionStand: IDimensionStand = sampleWithRequiredData;
        const dimensionStandCollection: IDimensionStand[] = [sampleWithPartialData];
        expectedResult = service.addDimensionStandToCollectionIfMissing(dimensionStandCollection, dimensionStand);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(dimensionStand);
      });

      it('should add only unique DimensionStand to an array', () => {
        const dimensionStandArray: IDimensionStand[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const dimensionStandCollection: IDimensionStand[] = [sampleWithRequiredData];
        expectedResult = service.addDimensionStandToCollectionIfMissing(dimensionStandCollection, ...dimensionStandArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const dimensionStand: IDimensionStand = sampleWithRequiredData;
        const dimensionStand2: IDimensionStand = sampleWithPartialData;
        expectedResult = service.addDimensionStandToCollectionIfMissing([], dimensionStand, dimensionStand2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(dimensionStand);
        expect(expectedResult).toContain(dimensionStand2);
      });

      it('should accept null and undefined values', () => {
        const dimensionStand: IDimensionStand = sampleWithRequiredData;
        expectedResult = service.addDimensionStandToCollectionIfMissing([], null, dimensionStand, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(dimensionStand);
      });

      it('should return initial array if no DimensionStand is added', () => {
        const dimensionStandCollection: IDimensionStand[] = [sampleWithRequiredData];
        expectedResult = service.addDimensionStandToCollectionIfMissing(dimensionStandCollection, undefined, null);
        expect(expectedResult).toEqual(dimensionStandCollection);
      });
    });

    describe('compareDimensionStand', () => {
      it('Should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.compareDimensionStand(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('Should return false if one entity is null', () => {
        const entity1 = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
        const entity2 = null;

        const compareResult1 = service.compareDimensionStand(entity1, entity2);
        const compareResult2 = service.compareDimensionStand(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey differs', () => {
        const entity1 = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
        const entity2 = { id: '1361f429-3817-4123-8ee3-fdf8943310b2' };

        const compareResult1 = service.compareDimensionStand(entity1, entity2);
        const compareResult2 = service.compareDimensionStand(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey matches', () => {
        const entity1 = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
        const entity2 = { id: '9fec3727-3421-4967-b213-ba36557ca194' };

        const compareResult1 = service.compareDimensionStand(entity1, entity2);
        const compareResult2 = service.compareDimensionStand(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
