import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VacunasComponent } from './vacunas.component';

describe('ConsultoriosComponent', () => {
  let component: VacunasComponent;
  let fixture: ComponentFixture<VacunasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VacunasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VacunasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
