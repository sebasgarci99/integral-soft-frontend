import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultoriosComponent } from './consultorios.component';

describe('ConsultoriosComponent', () => {
  let component: ConsultoriosComponent;
  let fixture: ComponentFixture<ConsultoriosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsultoriosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsultoriosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
