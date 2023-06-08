import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ProductsStateModule } from '@nx-example/products/state';

import { ProductDetailPageComponent } from './product-detail-page/product-detail-page.component';

@NgModule({
  imports: [
    CommonModule,
    ProductsStateModule,

    RouterModule.forChild([
      { path: ':productId', component: ProductDetailPageComponent },
    ]),
  ],
  declarations: [ProductDetailPageComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ProductsDetailPageModule {}
