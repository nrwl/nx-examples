import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { LoadProductsSuccess, ProductsActionTypes } from './products.actions';
import { exhaustMap, map, of } from 'rxjs';
import { Product } from '@nx-example/shared/product/types';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  constructor(
    private http: HttpClient,
    @Inject('BASE_API_PATH') private baseUrl: string
  ) {}

  getProducts() {
    return this.http.get<Product[]>(`${this.baseUrl}/api/products`);
  }
}

@Injectable({ providedIn: 'root' })
export class ProductsEffects {
  loadProducts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductsActionTypes.LoadProducts),
      exhaustMap(() =>
        this.productsService
          .getProducts()
          .pipe(map((p) => new LoadProductsSuccess(p)))
      )
    )
  );

  constructor(
    private actions$: Actions,
    private productsService: ProductsService
  ) {}
}

export const createMockProductService = (products: Product[]) => {
  class MockProductsService {
    getProducts() {
      return of(products);
    }
  }
  return {
    provide: ProductsService,
    useClass: MockProductsService,
  };
};
