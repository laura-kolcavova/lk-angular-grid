import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LkGridComponent } from './lk-grid.component';

describe('LkGridComponent', () => {
  let component: LkGridComponent;
  let fixture: ComponentFixture<LkGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LkGridComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LkGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
