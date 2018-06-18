import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateAtCameraComponent } from './create-at-camera.component';

describe('CreateAtCameraComponent', () => {
  let component: CreateAtCameraComponent;
  let fixture: ComponentFixture<CreateAtCameraComponent>;

  beforeEach(
    async(() => {
      TestBed.configureTestingModule({
        declarations: [CreateAtCameraComponent]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateAtCameraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
