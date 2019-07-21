import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RemoveAccountComponent } from './remove-account.component';
import { MatDividerModule, MatCardModule, MatSnackBarModule } from '@angular/material';
import { RouterModule } from '@angular/router';

describe('RemoveAccountComponent', () => {
  let component: RemoveAccountComponent;
  let fixture: ComponentFixture<RemoveAccountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ MatDividerModule, MatCardModule, MatSnackBarModule, RouterModule.forRoot([]) ],
      declarations: [ RemoveAccountComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RemoveAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
