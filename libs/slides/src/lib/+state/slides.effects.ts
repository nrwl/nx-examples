import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { DataPersistence } from '@nrwl/nx';

import { SlidesState } from './slides.interfaces';
import { LoadData } from './slides.actions';

@Injectable()
export class SlidesEffects {
  @Effect()
  loadData = this.d.fetch('LOAD_DATA', {
    run: (a: LoadData, state: SlidesState) => {
      return {
        type: 'DATA_LOADED',
        payload: {}
      };
    },

    onError: (a: LoadData, error) => {
      console.error('Error', error);
    }
  });

  constructor(private actions: Actions, private d: DataPersistence<SlidesState>) {}
}
