import { TestBed } from '@angular/core/testing';
import { SharedProductStateModule } from './shared-product-state.module';

describe('SharedProductStateModule', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedProductStateModule],
    }).compileComponents();
  });

  it('should create', () => {
    expect(SharedProductStateModule).toBeDefined();
  });
});
