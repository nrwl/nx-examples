import { async, TestBed } from '@angular/core/testing';
import { CartStateModule } from './cart-state.module';

describe('CartStateModule', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [CartStateModule],
    }).compileComponents();
  }));

  it('should create', () => {
    expect(CartStateModule).toBeDefined();
  });
});
