import { TestBed } from '@angular/core/testing';

import { RegistroTemperaturaService } from './reg-temperatura.service';

describe('RegistroTemperaturaService', () => {
  let service: RegistroTemperaturaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RegistroTemperaturaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
