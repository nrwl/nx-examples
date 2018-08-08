import { async, TestBed } from '@angular/core/testing';
import { TeachApp1Module } from './teach-app1.module';

describe('TeachApp1Module', () => {
  beforeEach(
    async(() => {
      TestBed.configureTestingModule({
        imports: [TeachApp1Module]
      }).compileComponents();
    })
  );

  it('should create', () => {
    expect(TeachApp1Module).toBeDefined();
  });
});
