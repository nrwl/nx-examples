import { async, TestBed } from '@angular/core/testing';
import { ProductsStateModule } from './products-state.module';

describe('ProductsStateModule', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ProductsStateModule],
    }).compileComponents();
  }));

  it('should create', () => {
    expect(ProductsStateModule).toBeDefined();
  });
});
