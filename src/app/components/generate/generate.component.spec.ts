import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GenerateComponent } from './generate.component';
import {
  MatDividerModule,
  MatFormFieldModule,
  MatIconModule,
  MatTabsModule,
  MatInputModule,
  MatCheckboxModule,
  MatSnackBarModule
} from '@angular/material';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('GenerateComponent', () => {
  let component: GenerateComponent;
  let fixture: ComponentFixture<GenerateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MatDividerModule,
        MatFormFieldModule,
        FormsModule,
        ReactiveFormsModule,
        MatIconModule,
        MatTabsModule,
        MatInputModule,
        MatCheckboxModule,
        MatSnackBarModule,
        BrowserAnimationsModule,
        RouterTestingModule
      ],
      declarations: [GenerateComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GenerateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
