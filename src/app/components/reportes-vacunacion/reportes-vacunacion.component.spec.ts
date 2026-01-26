import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportesVacunacionComponent } from './reportes-vacunacion.component';

describe('ReportesVacunacionComponent', () => {
  let component: ReportesVacunacionComponent;
  let fixture: ComponentFixture<ReportesVacunacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportesVacunacionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportesVacunacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
