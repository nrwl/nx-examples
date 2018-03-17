import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { D3ExampleComponent } from './d3-example.component';

describe('D3ExampleComponent', () => {
  let component: D3ExampleComponent;
  let fixture: ComponentFixture<D3ExampleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ D3ExampleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(D3ExampleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
