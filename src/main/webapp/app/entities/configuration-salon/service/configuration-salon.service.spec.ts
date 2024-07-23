import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { IConfigurationSalon } from '../configuration-salon.model';
import { sampleWithRequiredData, sampleWithNewData, sampleWithPartialData, sampleWithFullData } from '../configuration-salon.test-samples';

import { ConfigurationSalonService } from './configuration-salon.service';

const requireRestSample: IConfigurationSalon = {
  ...sampleWithRequiredData,
};

describe('ConfigurationSalon Service', () => {
  let service: ConfigurationSalonService;
  let httpMock: HttpTestingController;
  let expectedResult: IConfigurationSalon | IConfigurationSalon[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    expectedResult = null;
    service = TestBed.inject(ConfigurationSalonService);
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

    it('should create a ConfigurationSalon', () => {
      const configurationSalon = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(configurationSalon).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a ConfigurationSalon', () => {
      const configurationSalon = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(configurationSalon).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a ConfigurationSalon', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of ConfigurationSalon', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a ConfigurationSalon', () => {
      const expected = true;

      service.delete('9fec3727-3421-4967-b213-ba36557ca194').subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    describe('addConfigurationSalonToCollectionIfMissing', () => {
      it('should add a ConfigurationSalon to an empty array', () => {
        const configurationSalon: IConfigurationSalon = sampleWithRequiredData;
        expectedResult = service.addConfigurationSalonToCollectionIfMissing([], configurationSalon);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(configurationSalon);
      });

      it('should not add a ConfigurationSalon to an array that contains it', () => {
        const configurationSalon: IConfigurationSalon = sampleWithRequiredData;
        const configurationSalonCollection: IConfigurationSalon[] = [
          {
            ...configurationSalon,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addConfigurationSalonToCollectionIfMissing(configurationSalonCollection, configurationSalon);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a ConfigurationSalon to an array that doesn't contain it", () => {
        const configurationSalon: IConfigurationSalon = sampleWithRequiredData;
        const configurationSalonCollection: IConfigurationSalon[] = [sampleWithPartialData];
        expectedResult = service.addConfigurationSalonToCollectionIfMissing(configurationSalonCollection, configurationSalon);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(configurationSalon);
      });

      it('should add only unique ConfigurationSalon to an array', () => {
        const configurationSalonArray: IConfigurationSalon[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const configurationSalonCollection: IConfigurationSalon[] = [sampleWithRequiredData];
        expectedResult = service.addConfigurationSalonToCollectionIfMissing(configurationSalonCollection, ...configurationSalonArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const configurationSalon: IConfigurationSalon = sampleWithRequiredData;
        const configurationSalon2: IConfigurationSalon = sampleWithPartialData;
        expectedResult = service.addConfigurationSalonToCollectionIfMissing([], configurationSalon, configurationSalon2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(configurationSalon);
        expect(expectedResult).toContain(configurationSalon2);
      });

      it('should accept null and undefined values', () => {
        const configurationSalon: IConfigurationSalon = sampleWithRequiredData;
        expectedResult = service.addConfigurationSalonToCollectionIfMissing([], null, configurationSalon, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(configurationSalon);
      });

      it('should return initial array if no ConfigurationSalon is added', () => {
        const configurationSalonCollection: IConfigurationSalon[] = [sampleWithRequiredData];
        expectedResult = service.addConfigurationSalonToCollectionIfMissing(configurationSalonCollection, undefined, null);
        expect(expectedResult).toEqual(configurationSalonCollection);
      });
    });

    describe('compareConfigurationSalon', () => {
      it('Should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.compareConfigurationSalon(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('Should return false if one entity is null', () => {
        const entity1 = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
        const entity2 = null;

        const compareResult1 = service.compareConfigurationSalon(entity1, entity2);
        const compareResult2 = service.compareConfigurationSalon(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey differs', () => {
        const entity1 = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
        const entity2 = { id: '1361f429-3817-4123-8ee3-fdf8943310b2' };

        const compareResult1 = service.compareConfigurationSalon(entity1, entity2);
        const compareResult2 = service.compareConfigurationSalon(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('Should return false if primaryKey matches', () => {
        const entity1 = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
        const entity2 = { id: '9fec3727-3421-4967-b213-ba36557ca194' };

        const compareResult1 = service.compareConfigurationSalon(entity1, entity2);
        const compareResult2 = service.compareConfigurationSalon(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
