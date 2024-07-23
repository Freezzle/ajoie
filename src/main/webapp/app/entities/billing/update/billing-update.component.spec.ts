import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, HttpResponse } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of, Subject, from } from 'rxjs';

import { IStand } from 'app/entities/stand/stand.model';
import { StandService } from 'app/entities/stand/service/stand.service';
import { BillingService } from '../service/billing.service';
import { IBilling } from '../billing.model';
import { BillingFormService } from './billing-form.service';

import { BillingUpdateComponent } from './billing-update.component';

describe('Billing Management Update Component', () => {
  let comp: BillingUpdateComponent;
  let fixture: ComponentFixture<BillingUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let billingFormService: BillingFormService;
  let billingService: BillingService;
  let standService: StandService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BillingUpdateComponent],
      providers: [
        provideHttpClient(),
        FormBuilder,
        {
          provide: ActivatedRoute,
          useValue: {
            params: from([{}]),
          },
        },
      ],
    })
      .overrideTemplate(BillingUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(BillingUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    billingFormService = TestBed.inject(BillingFormService);
    billingService = TestBed.inject(BillingService);
    standService = TestBed.inject(StandService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('Should call stand query and add missing value', () => {
      const billing: IBilling = { id: '1361f429-3817-4123-8ee3-fdf8943310b2' };
      const stand: IStand = { id: 'acef9ada-14f4-41ca-b00d-470384f19237' };
      billing.stand = stand;

      const standCollection: IStand[] = [{ id: '1dae4b64-7587-46ef-93bf-a2fb1c2b5ff7' }];
      jest.spyOn(standService, 'query').mockReturnValue(of(new HttpResponse({ body: standCollection })));
      const expectedCollection: IStand[] = [stand, ...standCollection];
      jest.spyOn(standService, 'addStandToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ billing });
      comp.ngOnInit();

      expect(standService.query).toHaveBeenCalled();
      expect(standService.addStandToCollectionIfMissing).toHaveBeenCalledWith(standCollection, stand);
      expect(comp.standsCollection).toEqual(expectedCollection);
    });

    it('Should update editForm', () => {
      const billing: IBilling = { id: '1361f429-3817-4123-8ee3-fdf8943310b2' };
      const stand: IStand = { id: 'cd3f302b-61cf-428a-8e11-1f4028fcbac5' };
      billing.stand = stand;

      activatedRoute.data = of({ billing });
      comp.ngOnInit();

      expect(comp.standsCollection).toContain(stand);
      expect(comp.billing).toEqual(billing);
    });
  });

  describe('save', () => {
    it('Should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IBilling>>();
      const billing = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
      jest.spyOn(billingFormService, 'getBilling').mockReturnValue(billing);
      jest.spyOn(billingService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ billing });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: billing }));
      saveSubject.complete();

      // THEN
      expect(billingFormService.getBilling).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(billingService.update).toHaveBeenCalledWith(expect.objectContaining(billing));
      expect(comp.isSaving).toEqual(false);
    });

    it('Should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IBilling>>();
      const billing = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
      jest.spyOn(billingFormService, 'getBilling').mockReturnValue({ id: null });
      jest.spyOn(billingService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ billing: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: billing }));
      saveSubject.complete();

      // THEN
      expect(billingFormService.getBilling).toHaveBeenCalled();
      expect(billingService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('Should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IBilling>>();
      const billing = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
      jest.spyOn(billingService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ billing });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(billingService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });

  describe('Compare relationships', () => {
    describe('compareStand', () => {
      it('Should forward to standService', () => {
        const entity = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
        const entity2 = { id: '1361f429-3817-4123-8ee3-fdf8943310b2' };
        jest.spyOn(standService, 'compareStand');
        comp.compareStand(entity, entity2);
        expect(standService.compareStand).toHaveBeenCalledWith(entity, entity2);
      });
    });
  });
});
