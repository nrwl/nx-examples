import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { appReducer } from './+state/app.reducer';
import { appInitialState } from './+state/app.init';
import { AppEffects } from './+state/app.effects';

@NgModule({
  imports: [
    CommonModule,
    StoreModule.forFeature('app', appReducer, { initialState: appInitialState }),
    EffectsModule.forFeature([AppEffects])
  ],
  providers: [AppEffects]
})
export class ModelModule {}
