import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import {
  createMockProductService,
  SharedProductStateModule,
} from '@nx-example/shared/product/state';
import { products } from '@nx-example/shared/product/data';

import { HomePageComponent } from './home-page.component';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

describe('HomePageComponent', () => {
  let component: HomePageComponent;
  let fixture: ComponentFixture<HomePageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        StoreModule.forRoot({}),
        EffectsModule.forRoot(),
        SharedProductStateModule,
      ],
      declarations: [HomePageComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        createMockProductService(products),
        { provide: 'BASE_API_PATH', useValue: '' },
      ],
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
