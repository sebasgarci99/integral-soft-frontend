import { TestBed } from '@angular/core/testing';

import { RecoleccionService } from './recoleccion.service';

describe('RecoleccionService', () => {
  let service: RecoleccionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RecoleccionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
