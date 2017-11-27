import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { slidesReducer } from './+state/slides.reducer';
import { slidesInitialState } from './+state/slides.init';
import { SlidesEffects } from './+state/slides.effects';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([
      /* {path: '', pathMatch: 'full', component: InsertYourComponentHere} */
    ]),
    StoreModule.forFeature('slides', slidesReducer, { initialState: slidesInitialState }),
    EffectsModule.forFeature([SlidesEffects])
  ],
  providers: [SlidesEffects]
})
export class SlidesModule {}
