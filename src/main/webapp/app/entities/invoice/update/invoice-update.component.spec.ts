import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, HttpResponse } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of, Subject, from } from 'rxjs';

import { IBilling } from 'app/entities/billing/billing.model';
import { BillingService } from 'app/entities/billing/service/billing.service';
import { InvoiceService } from '../service/invoice.service';
import { IInvoice } from '../invoice.model';
import { InvoiceFormService } from './invoice-form.service';

import { InvoiceUpdateComponent } from './invoice-update.component';

describe('Invoice Management Update Component', () => {
  let comp: InvoiceUpdateComponent;
  let fixture: ComponentFixture<InvoiceUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let invoiceFormService: InvoiceFormService;
  let invoiceService: InvoiceService;
  let billingService: BillingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [InvoiceUpdateComponent],
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
      .overrideTemplate(InvoiceUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(InvoiceUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    invoiceFormService = TestBed.inject(InvoiceFormService);
    invoiceService = TestBed.inject(InvoiceService);
    billingService = TestBed.inject(BillingService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('Should call Billing query and add missing value', () => {
      const invoice: IInvoice = { id: '1361f429-3817-4123-8ee3-fdf8943310b2' };
      const billing: IBilling = { id: 'd5d56c20-99c9-46f4-9652-12232b1c7db7' };
      invoice.billing = billing;

      const billingCollection: IBilling[] = [{ id: '103dbbd3-d478-4995-b889-df0ed3e28dd9' }];
      jest.spyOn(billingService, 'query').mockReturnValue(of(new HttpResponse({ body: billingCollection })));
      const additionalBillings = [billing];
      const expectedCollection: IBilling[] = [...additionalBillings, ...billingCollection];
      jest.spyOn(billingService, 'addBillingToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ invoice });
      comp.ngOnInit();

      expect(billingService.query).toHaveBeenCalled();
      expect(billingService.addBillingToCollectionIfMissing).toHaveBeenCalledWith(
        billingCollection,
        ...additionalBillings.map(expect.objectContaining),
      );
      expect(comp.billingsSharedCollection).toEqual(expectedCollection);
    });

    it('Should update editForm', () => {
      const invoice: IInvoice = { id: '1361f429-3817-4123-8ee3-fdf8943310b2' };
      const billing: IBilling = { id: '821ab526-f2d8-4b2d-a146-2ff185ae788e' };
      invoice.billing = billing;

      activatedRoute.data = of({ invoice });
      comp.ngOnInit();

      expect(comp.billingsSharedCollection).toContain(billing);
      expect(comp.invoice).toEqual(invoice);
    });
  });

  describe('save', () => {
    it('Should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IInvoice>>();
      const invoice = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
      jest.spyOn(invoiceFormService, 'getInvoice').mockReturnValue(invoice);
      jest.spyOn(invoiceService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ invoice });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: invoice }));
      saveSubject.complete();

      // THEN
      expect(invoiceFormService.getInvoice).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(invoiceService.update).toHaveBeenCalledWith(expect.objectContaining(invoice));
      expect(comp.isSaving).toEqual(false);
    });

    it('Should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IInvoice>>();
      const invoice = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
      jest.spyOn(invoiceFormService, 'getInvoice').mockReturnValue({ id: null });
      jest.spyOn(invoiceService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ invoice: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: invoice }));
      saveSubject.complete();

      // THEN
      expect(invoiceFormService.getInvoice).toHaveBeenCalled();
      expect(invoiceService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('Should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IInvoice>>();
      const invoice = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
      jest.spyOn(invoiceService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ invoice });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(invoiceService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });

  describe('Compare relationships', () => {
    describe('compareBilling', () => {
      it('Should forward to billingService', () => {
        const entity = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
        const entity2 = { id: '1361f429-3817-4123-8ee3-fdf8943310b2' };
        jest.spyOn(billingService, 'compareBilling');
        comp.compareBilling(entity, entity2);
        expect(billingService.compareBilling).toHaveBeenCalledWith(entity, entity2);
      });
    });
  });
});
