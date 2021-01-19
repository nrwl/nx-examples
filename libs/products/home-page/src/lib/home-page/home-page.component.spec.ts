import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { SharedProductStateModule } from '@nx-example/shared/product/state';
import { SvgComponent } from '../svg-component/svg.component';
import { HomePageComponent } from './home-page.component';

describe('HomePageComponent', () => {
  let component: HomePageComponent;
  let fixture: ComponentFixture<HomePageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        StoreModule.forRoot({}),
        RouterTestingModule,
        SharedProductStateModule,
      ],
      declarations: [HomePageComponent, SvgComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render products', () => {
    expect(fixture.nativeElement.querySelectorAll('li').length).toEqual(5);
  });
});
