import { Component, OnInit } from '@angular/core';

import '@nx-example/shared/product/ui';

import { products } from '@nx-example/shared/product/data';
import { Product } from '@nx-example/shared/product/types';

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
