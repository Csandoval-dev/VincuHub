import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertificadosManager } from './certificados-manager';

describe('CertificadosManager', () => {
  let component: CertificadosManager;
  let fixture: ComponentFixture<CertificadosManager>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CertificadosManager]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CertificadosManager);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
