import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SignatureComponent } from './signature.component';
import {
  MatDividerModule,
  MatFormFieldModule,
  MatIconModule,
  MatSnackBarModule,
  MatInputModule
} from '@angular/material';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TextFieldModule } from '@angular/cdk/text-field';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { createTranslateLoader } from '../../app.module';
import { RouterTestingModule } from '@angular/router/testing';

describe('SignatureComponent', () => {
  let component: SignatureComponent;
  let fixture: ComponentFixture<SignatureComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MatDividerModule,
        MatFormFieldModule,
        FormsModule,
        ReactiveFormsModule,
        MatIconModule,
        TextFieldModule,
        MatSnackBarModule,
        MatInputModule,
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
      declarations: [SignatureComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SignatureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
