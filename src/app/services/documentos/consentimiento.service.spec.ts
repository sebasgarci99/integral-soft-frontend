import { TestBed } from '@angular/core/testing';

import { ConsentimientoService } from './consentimiento.service';

describe('ConsentimientoService', () => {
  let service: ConsentimientoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConsentimientoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
