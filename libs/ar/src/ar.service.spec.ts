import { TestBed, inject } from '@angular/core/testing';

import { ArService } from './ar.service';

describe('ArService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ArService]
    });
  });

  it(
    'should be created',
    inject([ArService], (service: ArService) => {
      expect(service).toBeTruthy();
    })
  );
});
