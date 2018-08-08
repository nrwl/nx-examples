import { async, TestBed } from '@angular/core/testing';
import { TeachApp2Module } from './teach-app2.module';

describe('TeachApp2Module', () => {
  beforeEach(
    async(() => {
      TestBed.configureTestingModule({
        imports: [TeachApp2Module]
      }).compileComponents();
    })
  );

  it('should create', () => {
    expect(TeachApp2Module).toBeDefined();
  });
});
