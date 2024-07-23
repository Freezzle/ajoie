import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';

import { DimensionStandDetailComponent } from './dimension-stand-detail.component';

describe('DimensionStand Management Detail Component', () => {
  let comp: DimensionStandDetailComponent;
  let fixture: ComponentFixture<DimensionStandDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DimensionStandDetailComponent],
      providers: [
        provideRouter(
          [
            {
              path: '**',
              component: DimensionStandDetailComponent,
              resolve: { dimensionStand: () => of({ id: '9fec3727-3421-4967-b213-ba36557ca194' }) },
            },
          ],
          withComponentInputBinding(),
        ),
      ],
    })
      .overrideTemplate(DimensionStandDetailComponent, '')
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DimensionStandDetailComponent);
    comp = fixture.componentInstance;
  });

  describe('OnInit', () => {
    it('Should load dimensionStand on init', async () => {
      const harness = await RouterTestingHarness.create();
      const instance = await harness.navigateByUrl('/', DimensionStandDetailComponent);

      // THEN
      expect(instance.dimensionStand()).toEqual(expect.objectContaining({ id: '9fec3727-3421-4967-b213-ba36557ca194' }));
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
