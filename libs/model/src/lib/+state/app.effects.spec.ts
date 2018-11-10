import { TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { DataPersistence } from '@nrwl/nx';
import { hot, cold } from '@nrwl/nx/testing';
import { AppEffects } from './app.effects';

describe('AppEffects', () => {
  let actions;
  let effects: AppEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [StoreModule.forRoot({})],
      providers: [AppEffects, DataPersistence, provideMockActions(() => actions)]
    });

    effects = TestBed.get(AppEffects);
  });

  describe('someEffect', () => {
    it('should work', async () => {
      actions = hot('a', { a: { type: 'LOAD_DATA' } });
      const expected = cold('a', { a: {type: 'DATA_LOADED', payload: {}}});
      expect(effects.loadData).toBeObservable(expected);
    });
  });
});
