import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';

import { BillingDetailComponent } from './billing-detail.component';

describe('Billing Management Detail Component', () => {
  let comp: BillingDetailComponent;
  let fixture: ComponentFixture<BillingDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillingDetailComponent],
      providers: [
        provideRouter(
          [
            {
              path: '**',
              component: BillingDetailComponent,
              resolve: { billing: () => of({ id: '9fec3727-3421-4967-b213-ba36557ca194' }) },
            },
          ],
          withComponentInputBinding(),
        ),
      ],
    })
      .overrideTemplate(BillingDetailComponent, '')
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BillingDetailComponent);
    comp = fixture.componentInstance;
  });

  describe('OnInit', () => {
    it('Should load billing on init', async () => {
      const harness = await RouterTestingHarness.create();
      const instance = await harness.navigateByUrl('/', BillingDetailComponent);

      // THEN
      expect(instance.billing()).toEqual(expect.objectContaining({ id: '9fec3727-3421-4967-b213-ba36557ca194' }));
    });
  });

  describe('PreviousState', () => {
    it('Should navigate to previous state', () => {
      jest.spyOn(window.history, 'back');
      comp.previousState();
      expect(window.history.back).toHaveBeenCalled();
    });
  });
});
