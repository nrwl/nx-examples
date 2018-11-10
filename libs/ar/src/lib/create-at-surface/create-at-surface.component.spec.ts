import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateAtSurfaceComponent } from './create-at-surface.component';
import { ArService } from '@nx-examples/ar/src/lib/ar.service';

describe('CreateAtSurfaceComponent', () => {
  let component: CreateAtSurfaceComponent;
  let fixture: ComponentFixture<CreateAtSurfaceComponent>;

  beforeEach(
    async(() => {
      TestBed.configureTestingModule({
        declarations: [CreateAtSurfaceComponent],
        providers: [ArService]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateAtSurfaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
