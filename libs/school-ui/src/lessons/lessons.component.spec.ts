import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LessonsComponent } from './lessons.component';

describe('LessonsComponent', () => {
  let component: LessonsComponent;
  let fixture: ComponentFixture<LessonsComponent>;

  beforeEach(
    async(() => {
      TestBed.configureTestingModule({
        declarations: [LessonsComponent]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(LessonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
