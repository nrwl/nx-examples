import { TestBed, async } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [AppComponent]
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should render a title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.nativeElement.textContent).toContain('Welcome to products!');
  });

  it(`should render the route outlet`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
  });
});
