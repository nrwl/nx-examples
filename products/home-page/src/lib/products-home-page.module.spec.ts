import { async, TestBed } from '@angular/core/testing';
import { ProductsHomePageModule } from './products-home-page.module';

describe('ProductsHomePageModule', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ProductsHomePageModule],
    }).compileComponents();
  }));

  it('should create', () => {
    expect(ProductsHomePageModule).toBeDefined();
  });
});
