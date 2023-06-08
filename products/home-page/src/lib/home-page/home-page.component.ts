import { Component } from '@angular/core';

import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import {
  getProducts,
  getProductsState,
  ProductsPartialState,
} from '@nx-example/products/state';
import { Product } from '@nx-example/products/types';
import '@nx-example/products/ui';

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
}
