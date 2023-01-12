import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuildableAngularLibraryComponent } from './buildable-angular-library.component';

describe('BuildableAngularLibraryComponent', () => {
  let component: BuildableAngularLibraryComponent;
  let fixture: ComponentFixture<BuildableAngularLibraryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuildableAngularLibraryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BuildableAngularLibraryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
