import { TestBed } from '@angular/core/testing';
import { SharedCartStateModule } from './shared-cart-state.module';

describe('SharedCartStateModule', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedCartStateModule],
    }).compileComponents();
  });

  it('should create', () => {
    expect(SharedCartStateModule).toBeDefined();
  });
});
