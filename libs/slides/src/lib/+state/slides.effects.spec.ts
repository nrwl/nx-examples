import { TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { DataPersistence } from '@nrwl/nx';
import { hot, cold } from '@nrwl/nx/testing';
import { SlidesEffects } from './slides.effects';

describe('SlidesEffects', () => {
  let actions;
  let effects: SlidesEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [StoreModule.forRoot({})],
      providers: [SlidesEffects, DataPersistence, provideMockActions(() => actions)]
    });

    effects = TestBed.get(SlidesEffects);
  });

  describe('someEffect', () => {
    it('should work', () => {
      actions = hot('a', { a: { type: 'LOAD_DATA' } });
      const expected = cold('a', { a: { type: 'DATA_LOADED', payload: {} }});
      expect(effects.loadData).toBeObservable(expected);
    });
  });
});
