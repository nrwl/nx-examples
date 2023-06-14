import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { LoadProductsSuccess, ProductsActionTypes } from './products.actions';
import { exhaustMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProductsEffects {
  loadProducts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductsActionTypes.LoadProducts),
      exhaustMap(() =>
        fetch('http://localhost:8888/.netlify/functions/api/products')
          .then((r) => r.json())
          .then((p) => new LoadProductsSuccess(p))
      )
    )
  );

  constructor(private actions$: Actions) {
    console.log('ProductsEffects created');
  }
}
