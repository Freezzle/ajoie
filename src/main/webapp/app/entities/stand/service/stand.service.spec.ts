import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { IStand } from '../stand.model';
import { sampleWithRequiredData, sampleWithNewData, sampleWithPartialData, sampleWithFullData } from '../stand.test-samples';

import { StandService } from './stand.service';

const requireRestSample: IStand = {
  ...sampleWithRequiredData,
};

describe('Stand Service', () => {
  let service: StandService;
  let httpMock: HttpTestingController;
  let expectedResult: IStand | IStand[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    expectedResult = null;
    service = TestBed.inject(StandService);
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

    it('should create a Stand', () => {
      const stand = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(stand).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a Stand', () => {
      const stand = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(stand).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a Stand', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of Stand', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a Stand', () => {
      const expected = true;

      service.delete('9fec3727-3421-4967-b213-ba36557ca194').subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addStandToCollectionIfMissing', () => {
      it('should add a Stand to an empty array', () => {
        const stand: IStand = sampleWithRequiredData;
        expectedResult = service.addStandToCollectionIfMissing([], stand);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(stand);
      });

      it('should not add a Stand to an array that contains it', () => {
        const stand: IStand = sampleWithRequiredData;
        const standCollection: IStand[] = [
          {
            ...stand,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addStandToCollectionIfMissing(standCollection, stand);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a Stand to an array that doesn't contain it", () => {
        const stand: IStand = sampleWithRequiredData;
        const standCollection: IStand[] = [sampleWithPartialData];
        expectedResult = service.addStandToCollectionIfMissing(standCollection, stand);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(stand);
      });

      it('should add only unique Stand to an array', () => {
        const standArray: IStand[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const standCollection: IStand[] = [sampleWithRequiredData];
        expectedResult = service.addStandToCollectionIfMissing(standCollection, ...standArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const stand: IStand = sampleWithRequiredData;
        const stand2: IStand = sampleWithPartialData;
        expectedResult = service.addStandToCollectionIfMissing([], stand, stand2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(stand);
        expect(expectedResult).toContain(stand2);
      });

      it('should accept null and undefined values', () => {
        const stand: IStand = sampleWithRequiredData;
        expectedResult = service.addStandToCollectionIfMissing([], null, stand, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(stand);
      });

      it('should return initial array if no Stand is added', () => {
        const standCollection: IStand[] = [sampleWithRequiredData];
        expectedResult = service.addStandToCollectionIfMissing(standCollection, undefined, null);
        expect(expectedResult).toEqual(standCollection);
      });
    });

    describe('compareStand', () => {
      it('Should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.compareStand(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('Should return false if one entity is null', () => {
        const entity1 = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
        const entity2 = null;

        const compareResult1 = service.compareStand(entity1, entity2);
        const compareResult2 = service.compareStand(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey differs', () => {
        const entity1 = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
        const entity2 = { id: '1361f429-3817-4123-8ee3-fdf8943310b2' };

        const compareResult1 = service.compareStand(entity1, entity2);
        const compareResult2 = service.compareStand(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey matches', () => {
        const entity1 = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
        const entity2 = { id: '9fec3727-3421-4967-b213-ba36557ca194' };

        const compareResult1 = service.compareStand(entity1, entity2);
        const compareResult2 = service.compareStand(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
