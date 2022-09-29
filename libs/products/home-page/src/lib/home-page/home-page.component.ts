import { Component } from '@angular/core';

import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import * as ProductStateActions from 'libs/shared/product/state/src/lib/+state/products.actions';

import {
  getProducts,
  getProductsState,
  ProductsPartialState,
} from '@nx-example/shared/product/state';
import { Product } from '@nx-example/shared/product/types';
import '@nx-example/shared/product/ui';

@Component({
  selector: 'products-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss'],
})
export class HomePageComponent {
  products: Observable<Product[]> = this.store.pipe(
    select(getProductsState),
    select(getProducts)
  );

  constructor(private store: Store<ProductsPartialState>) {}

  action: ProductStateActions.ProductsAction;
}
