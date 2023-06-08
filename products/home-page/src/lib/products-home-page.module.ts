import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ProductsStateModule } from '@nx-example/products/state';

import { HomePageComponent } from './home-page/home-page.component';

@NgModule({
  imports: [
    CommonModule,
    ProductsStateModule,

    RouterModule.forChild([
      {
        path: '',
        pathMatch: 'full',
        component: HomePageComponent,
      },
    ]),
  ],
  declarations: [HomePageComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ProductsHomePageModule {}
