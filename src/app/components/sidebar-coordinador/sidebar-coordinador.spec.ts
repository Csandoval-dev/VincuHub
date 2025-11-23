import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidebarCoordinador } from './sidebar-coordinador';

describe('SidebarCoordinador', () => {
  let component: SidebarCoordinador;
  let fixture: ComponentFixture<SidebarCoordinador>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarCoordinador]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SidebarCoordinador);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
