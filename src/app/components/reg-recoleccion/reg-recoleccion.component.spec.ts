import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegRecoleccionComponent } from './reg-recoleccion.component';

describe('RegRecoleccionComponent', () => {
  let component: RegRecoleccionComponent;
  let fixture: ComponentFixture<RegRecoleccionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegRecoleccionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegRecoleccionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
