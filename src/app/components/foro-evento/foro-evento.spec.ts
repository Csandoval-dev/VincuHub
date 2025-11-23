import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForoEvento } from './foro-evento';

describe('ForoEvento', () => {
  let component: ForoEvento;
  let fixture: ComponentFixture<ForoEvento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForoEvento]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ForoEvento);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
