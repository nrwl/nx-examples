import { Component, OnInit } from '@angular/core';

import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import {
  getProducts,
  getProductsState,
  LoadProducts,
  ProductsPartialState,
} from '@nx-example/shared/product/state';
import { Product } from '@nx-example/shared/product/types';
import '@nx-example/shared/product/ui';

@Component({
  selector: 'products-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss'],
})
export class HomePageComponent implements OnInit {
  products: Observable<Product[]> = this.store.pipe(
    select(getProductsState),
    select(getProducts)
  );

  constructor(private store: Store<ProductsPartialState>) {}

  ngOnInit() {
    this.store.dispatch(new LoadProducts());
  }
}
