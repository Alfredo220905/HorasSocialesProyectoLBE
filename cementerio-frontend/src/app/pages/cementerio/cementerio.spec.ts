import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CementerioComponent } from './cementerio.component';

describe('Cementerio', () => {
  let component: CementerioComponent;
  let fixture: ComponentFixture<CementerioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CementerioComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CementerioComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
