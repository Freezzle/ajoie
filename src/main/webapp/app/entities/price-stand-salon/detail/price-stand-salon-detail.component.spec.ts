import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';

import { PriceStandSalonDetailComponent } from './price-stand-salon-detail.component';

describe('PriceStandSalon Management Detail Component', () => {
  let comp: PriceStandSalonDetailComponent;
  let fixture: ComponentFixture<PriceStandSalonDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PriceStandSalonDetailComponent],
      providers: [
        provideRouter(
          [
            {
              path: '**',
              component: PriceStandSalonDetailComponent,
              resolve: { priceStandSalon: () => of({ id: '9fec3727-3421-4967-b213-ba36557ca194' }) },
            },
          ],
          withComponentInputBinding(),
        ),
      ],
    })
      .overrideTemplate(PriceStandSalonDetailComponent, '')
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PriceStandSalonDetailComponent);
    comp = fixture.componentInstance;
  });

  describe('OnInit', () => {
    it('Should load priceStandSalon on init', async () => {
      const harness = await RouterTestingHarness.create();
      const instance = await harness.navigateByUrl('/', PriceStandSalonDetailComponent);

      // THEN
      expect(instance.priceStandSalon()).toEqual(expect.objectContaining({ id: '9fec3727-3421-4967-b213-ba36557ca194' }));
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
