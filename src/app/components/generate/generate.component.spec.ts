import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GenerateComponent } from './generate.component';
import {
  MatDividerModule,
  MatFormFieldModule,
  MatIconModule,
  MatTabsModule,
  MatInputModule,
  MatCheckboxModule,
  MatSnackBarModule,
  MatSelectModule
} from '@angular/material';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { createTranslateLoader } from '../../app.module';

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
        MatSelectModule,
        BrowserAnimationsModule,
        RouterTestingModule,
        HttpClientModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: createTranslateLoader,
            deps: [HttpClient]
          }
        })
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
