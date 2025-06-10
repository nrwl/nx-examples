import { Component, inject } from '@angular/core';

import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';

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
  standalone: false,
})
export class HomePageComponent {
  private store = inject<Store<ProductsPartialState>>(Store);

  products: Observable<Product[]> = this.store.pipe(
    select(getProductsState),
    select(getProducts)
  );
}
