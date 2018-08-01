import { TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { DataPersistence } from '@nrwl/nx';
import { hot } from '@nrwl/nx/testing';

import { AppEffects } from './app.effects';
import { LoadApp, AppLoaded } from './app.actions';

import { Observable } from 'rxjs';

describe('AppEffects', () => {
  let actions$: Observable<any>;
  let effects$: AppEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [StoreModule.forRoot({})],
      providers: [AppEffects, DataPersistence, provideMockActions(() => actions$)]
    });

    effects$ = TestBed.get(AppEffects);
  });

  describe('someEffect', () => {
    it('should work', () => {
      actions$ = hot('-a-|', { a: new LoadApp({}) });
      expect(effects$.loadApp$).toBeObservable(hot('-a-|', { a: new AppLoaded({}) }));
    });
  });
});
