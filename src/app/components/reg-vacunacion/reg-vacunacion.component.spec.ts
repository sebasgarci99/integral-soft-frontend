import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegVacunacionComponent } from './reg-vacunacion.component';

describe('RegVacunacionComponent', () => {
  let component: RegVacunacionComponent;
  let fixture: ComponentFixture<RegVacunacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegVacunacionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegVacunacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
