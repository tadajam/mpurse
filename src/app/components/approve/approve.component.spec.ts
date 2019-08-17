import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ApproveComponent } from './approve.component';
import { MatDividerModule, MatSnackBarModule } from '@angular/material';
import { RouterModule } from '@angular/router';

describe('ApproveComponent', () => {
  let component: ApproveComponent;
  let fixture: ComponentFixture<ApproveComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
        imports: [ MatDividerModule, MatSnackBarModule, RouterModule.forRoot([]) ],
      declarations: [ ApproveComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApproveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
