import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import { StoreModule } from '@ngrx/store';
import { AppComponent } from './app.component';
import { EffectsModule } from '@ngrx/effects';
import { environment } from '../environments/environment';

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
    EffectsModule.forRoot(),
  ],
  providers: [{ provide: 'BASE_API_PATH', useValue: environment.baseApiPath }],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
