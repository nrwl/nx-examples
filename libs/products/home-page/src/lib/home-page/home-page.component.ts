import { Component, OnInit } from '@angular/core';

import '@nx-example/shared/product/ui';

import { Product } from '@nx-example/shared/product/types';
import { products } from '@nx-example/shared/product/data';

@Component({
  selector: 'products-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit {
  products: Product[];

  ngOnInit() {
    this.products = products;
  }
}
