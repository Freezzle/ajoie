import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { IExponent } from '../exponent.model';
import { sampleWithRequiredData, sampleWithNewData, sampleWithPartialData, sampleWithFullData } from '../exponent.test-samples';

import { ExponentService } from './exponent.service';

const requireRestSample: IExponent = {
  ...sampleWithRequiredData,
};

describe('Exponent Service', () => {
  let service: ExponentService;
  let httpMock: HttpTestingController;
  let expectedResult: IExponent | IExponent[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    expectedResult = null;
    service = TestBed.inject(ExponentService);
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

    it('should create a Exponent', () => {
      const exponent = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(exponent).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a Exponent', () => {
      const exponent = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(exponent).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a Exponent', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of Exponent', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a Exponent', () => {
      const expected = true;

      service.delete('9fec3727-3421-4967-b213-ba36557ca194').subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addExponentToCollectionIfMissing', () => {
      it('should add a Exponent to an empty array', () => {
        const exponent: IExponent = sampleWithRequiredData;
        expectedResult = service.addExponentToCollectionIfMissing([], exponent);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(exponent);
      });

      it('should not add a Exponent to an array that contains it', () => {
        const exponent: IExponent = sampleWithRequiredData;
        const exponentCollection: IExponent[] = [
          {
            ...exponent,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addExponentToCollectionIfMissing(exponentCollection, exponent);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a Exponent to an array that doesn't contain it", () => {
        const exponent: IExponent = sampleWithRequiredData;
        const exponentCollection: IExponent[] = [sampleWithPartialData];
        expectedResult = service.addExponentToCollectionIfMissing(exponentCollection, exponent);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(exponent);
      });

      it('should add only unique Exponent to an array', () => {
        const exponentArray: IExponent[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const exponentCollection: IExponent[] = [sampleWithRequiredData];
        expectedResult = service.addExponentToCollectionIfMissing(exponentCollection, ...exponentArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const exponent: IExponent = sampleWithRequiredData;
        const exponent2: IExponent = sampleWithPartialData;
        expectedResult = service.addExponentToCollectionIfMissing([], exponent, exponent2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(exponent);
        expect(expectedResult).toContain(exponent2);
      });

      it('should accept null and undefined values', () => {
        const exponent: IExponent = sampleWithRequiredData;
        expectedResult = service.addExponentToCollectionIfMissing([], null, exponent, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(exponent);
      });

      it('should return initial array if no Exponent is added', () => {
        const exponentCollection: IExponent[] = [sampleWithRequiredData];
        expectedResult = service.addExponentToCollectionIfMissing(exponentCollection, undefined, null);
        expect(expectedResult).toEqual(exponentCollection);
      });
    });

    describe('compareExponent', () => {
      it('Should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.compareExponent(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('Should return false if one entity is null', () => {
        const entity1 = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
        const entity2 = null;

        const compareResult1 = service.compareExponent(entity1, entity2);
        const compareResult2 = service.compareExponent(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey differs', () => {
        const entity1 = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
        const entity2 = { id: '1361f429-3817-4123-8ee3-fdf8943310b2' };

        const compareResult1 = service.compareExponent(entity1, entity2);
        const compareResult2 = service.compareExponent(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey matches', () => {
        const entity1 = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
        const entity2 = { id: '9fec3727-3421-4967-b213-ba36557ca194' };

        const compareResult1 = service.compareExponent(entity1, entity2);
        const compareResult2 = service.compareExponent(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
