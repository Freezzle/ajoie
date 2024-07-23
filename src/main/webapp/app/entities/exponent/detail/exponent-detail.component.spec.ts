import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';

import { ExponentDetailComponent } from './exponent-detail.component';

describe('Exponent Management Detail Component', () => {
  let comp: ExponentDetailComponent;
  let fixture: ComponentFixture<ExponentDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExponentDetailComponent],
      providers: [
        provideRouter(
          [
            {
              path: '**',
              component: ExponentDetailComponent,
              resolve: { exponent: () => of({ id: '9fec3727-3421-4967-b213-ba36557ca194' }) },
            },
          ],
          withComponentInputBinding(),
        ),
      ],
    })
      .overrideTemplate(ExponentDetailComponent, '')
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExponentDetailComponent);
    comp = fixture.componentInstance;
  });

  describe('OnInit', () => {
    it('Should load exponent on init', async () => {
      const harness = await RouterTestingHarness.create();
      const instance = await harness.navigateByUrl('/', ExponentDetailComponent);

      // THEN
      expect(instance.exponent()).toEqual(expect.objectContaining({ id: '9fec3727-3421-4967-b213-ba36557ca194' }));
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
