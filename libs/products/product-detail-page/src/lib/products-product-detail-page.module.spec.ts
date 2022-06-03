import { async, TestBed } from '@angular/core/testing';
import { ProductsProductDetailPageModule } from './products-product-detail-page.module';

describe('ProductsProductDetailPageModule', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ProductsProductDetailPageModule],
    }).compileComponents();
  }));

  it('should create', () => {
    expect(ProductsProductDetailPageModule).toBeDefined();
  });
});
