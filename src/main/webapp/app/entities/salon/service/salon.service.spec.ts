import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { ISalon } from '../salon.model';
import { sampleWithRequiredData, sampleWithNewData, sampleWithPartialData, sampleWithFullData } from '../salon.test-samples';

import { SalonService, RestSalon } from './salon.service';

const requireRestSample: RestSalon = {
  ...sampleWithRequiredData,
  startingDate: sampleWithRequiredData.startingDate?.toJSON(),
  endingDate: sampleWithRequiredData.endingDate?.toJSON(),
};

describe('Salon Service', () => {
  let service: SalonService;
  let httpMock: HttpTestingController;
  let expectedResult: ISalon | ISalon[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    expectedResult = null;
    service = TestBed.inject(SalonService);
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

    it('should create a Salon', () => {
      const salon = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(salon).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a Salon', () => {
      const salon = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(salon).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a Salon', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of Salon', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a Salon', () => {
      const expected = true;

      service.delete('9fec3727-3421-4967-b213-ba36557ca194').subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addSalonToCollectionIfMissing', () => {
      it('should add a Salon to an empty array', () => {
        const salon: ISalon = sampleWithRequiredData;
        expectedResult = service.addSalonToCollectionIfMissing([], salon);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(salon);
      });

      it('should not add a Salon to an array that contains it', () => {
        const salon: ISalon = sampleWithRequiredData;
        const salonCollection: ISalon[] = [
          {
            ...salon,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addSalonToCollectionIfMissing(salonCollection, salon);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a Salon to an array that doesn't contain it", () => {
        const salon: ISalon = sampleWithRequiredData;
        const salonCollection: ISalon[] = [sampleWithPartialData];
        expectedResult = service.addSalonToCollectionIfMissing(salonCollection, salon);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(salon);
      });

      it('should add only unique Salon to an array', () => {
        const salonArray: ISalon[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const salonCollection: ISalon[] = [sampleWithRequiredData];
        expectedResult = service.addSalonToCollectionIfMissing(salonCollection, ...salonArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const salon: ISalon = sampleWithRequiredData;
        const salon2: ISalon = sampleWithPartialData;
        expectedResult = service.addSalonToCollectionIfMissing([], salon, salon2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(salon);
        expect(expectedResult).toContain(salon2);
      });

      it('should accept null and undefined values', () => {
        const salon: ISalon = sampleWithRequiredData;
        expectedResult = service.addSalonToCollectionIfMissing([], null, salon, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(salon);
      });

      it('should return initial array if no Salon is added', () => {
        const salonCollection: ISalon[] = [sampleWithRequiredData];
        expectedResult = service.addSalonToCollectionIfMissing(salonCollection, undefined, null);
        expect(expectedResult).toEqual(salonCollection);
      });
    });

    describe('compareSalon', () => {
      it('Should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.compareSalon(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('Should return false if one entity is null', () => {
        const entity1 = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
        const entity2 = null;

        const compareResult1 = service.compareSalon(entity1, entity2);
        const compareResult2 = service.compareSalon(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey differs', () => {
        const entity1 = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
        const entity2 = { id: '1361f429-3817-4123-8ee3-fdf8943310b2' };

        const compareResult1 = service.compareSalon(entity1, entity2);
        const compareResult2 = service.compareSalon(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey matches', () => {
        const entity1 = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
        const entity2 = { id: '9fec3727-3421-4967-b213-ba36557ca194' };

        const compareResult1 = service.compareSalon(entity1, entity2);
        const compareResult2 = service.compareSalon(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
