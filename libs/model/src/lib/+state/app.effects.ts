import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { DataPersistence } from '@nrwl/nx';

import { AppState } from './app.interfaces';
import { LoadData } from './app.actions';

@Injectable()
export class AppEffects {
  @Effect()
  loadData = this.d.fetch('LOAD_DATA', {
    run: (a: LoadData, state: AppState) => {
      return {
        type: 'DATA_LOADED',
        payload: {}
      };
    },

    onError: (a: LoadData, error) => {
      console.error('Error', error);
    }
  });

  constructor(private actions: Actions, private d: DataPersistence<AppState>) {}
}
