import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsistenciaManager } from './asistencia-manager';

describe('AsistenciaManager', () => {
  let component: AsistenciaManager;
  let fixture: ComponentFixture<AsistenciaManager>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsistenciaManager]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AsistenciaManager);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
