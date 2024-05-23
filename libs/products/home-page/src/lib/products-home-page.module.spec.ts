import { TestBed } from '@angular/core/testing';
import { ProductsHomePageModule } from './products-home-page.module';

describe('ProductsHomePageModule', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductsHomePageModule],
    }).compileComponents();
  });

  it('should create', () => {
    expect(ProductsHomePageModule).toBeDefined();
  });
});
