import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import { StoreModule } from '@ngrx/store';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    RouterModule.forRoot(
      [
        {
          path: '',
          pathMatch: 'full',
          loadChildren: () =>
            import('@nx-example/products/home-page').then(
              (module) => module.ProductsHomePageModule
            ),
        },
        {
          path: 'product',
          loadChildren: () =>
            import('@nx-example/products/product-detail-page').then(
              (module) => module.ProductsProductDetailPageModule
            ),
        },
      ],
      { initialNavigation: 'enabledBlocking' }
    ),
    StoreModule.forRoot({}),
  ],
  providers: [],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
