import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { AppActions, AppActionTypes, LoadApp, AppLoaded } from './app.actions';
import { AppState } from './app.reducer';
import { DataPersistence } from '@nrwl/nx';

@Injectable()
export class AppEffects {
  @Effect() effect$ = this.actions$.ofType(AppActionTypes.AppAction);

  @Effect()
  loadApp$ = this.dataPersistence.fetch(AppActionTypes.LoadApp, {
    run: (action: LoadApp, state: AppState) => {
      return new AppLoaded(state);
    },

    onError: (action: LoadApp, error) => {
      console.error('Error', error);
    }
  });

  constructor(private actions$: Actions, private dataPersistence: DataPersistence<AppState>) {}
}
