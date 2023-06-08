import { async, TestBed } from '@angular/core/testing';
import { ProductsDetailPageModule } from './products-detail-page.module';

describe('ProductsDetailPageModule', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ProductsDetailPageModule],
    }).compileComponents();
  }));

  it('should create', () => {
    expect(ProductsDetailPageModule).toBeDefined();
  });
});
