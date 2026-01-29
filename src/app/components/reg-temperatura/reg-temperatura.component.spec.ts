import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegTemperaturaComponent } from './reg-temperatura.component';

describe('RegTemperaturaComponent', () => {
  let component: RegTemperaturaComponent;
  let fixture: ComponentFixture<RegTemperaturaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegTemperaturaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegTemperaturaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
