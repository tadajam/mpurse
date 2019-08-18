import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RemoveAccountComponent } from './remove-account.component';
import {
  MatDividerModule,
  MatCardModule,
  MatSnackBarModule
} from '@angular/material';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { createTranslateLoader } from '../../app.module';
import { RouterTestingModule } from '@angular/router/testing';

describe('RemoveAccountComponent', () => {
  let component: RemoveAccountComponent;
  let fixture: ComponentFixture<RemoveAccountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MatDividerModule,
        MatCardModule,
        MatSnackBarModule,
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
      declarations: [RemoveAccountComponent]
    }).compileComponents();
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
