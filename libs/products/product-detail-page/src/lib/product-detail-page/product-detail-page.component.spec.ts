import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { StoreModule } from '@ngrx/store';
import { of } from 'rxjs';

import {
  createMockProductService,
  SharedProductStateModule,
} from '@nx-example/shared/product/state';
import { products } from '@nx-example/shared/product/data';

import { ProductDetailPageComponent } from './product-detail-page.component';
import { EffectsModule } from '@ngrx/effects';

class MockActivatedRoute {
  paramMap = of(new Map<string, string>([['productId', '1']]));
}

describe('ProductDetailPageComponent', () => {
  let component: ProductDetailPageComponent;
  let fixture: ComponentFixture<ProductDetailPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        StoreModule.forRoot(),
        EffectsModule.forRoot(),
        SharedProductStateModule,
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useClass: MockActivatedRoute,
        },
        createMockProductService(products),
        { provide: 'BASE_API_PATH', useValue: '' },
      ],
      declarations: [ProductDetailPageComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(async () => {
    fixture = TestBed.createComponent(ProductDetailPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it(`should show the product's name`, () => {
    const name = fixture.nativeElement.querySelector('h1');
    expect(name).toBeTruthy();
    expect(name.textContent).toEqual('A Game of Thrones');
  });

  it(`should show the product's price`, () => {
    const price = fixture.nativeElement.querySelector(
      'nx-example-product-price'
    );
    expect(price).toBeTruthy();
    expect(price.textContent).toEqual('$100.00');
  });

  it(`should show the product's image`, () => {
    const image = fixture.nativeElement.querySelector('figure img');
    expect(image).toBeTruthy();
    expect(image.getAttribute('src')).toEqual(
      '/assets/images/a-game-of-thrones.jpg'
    );
  });
});
