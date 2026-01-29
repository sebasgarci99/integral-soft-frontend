import { TestBed } from '@angular/core/testing';

import { RegTemperaturaService } from './reg-temperatura.service';

describe('RegTemperaturaService', () => {
  let service: RegTemperaturaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RegTemperaturaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
