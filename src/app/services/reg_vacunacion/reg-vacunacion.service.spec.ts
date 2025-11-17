import { TestBed } from '@angular/core/testing';

import { RegVacunacionService } from './reg-vacunacion.service';

describe('RegVacunacionService', () => {
  let service: RegVacunacionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RegVacunacionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
