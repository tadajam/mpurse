import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ApproveComponent } from './approve.component';
import { MatDividerModule, MatSnackBarModule } from '@angular/material';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { createTranslateLoader } from '../../app.module';
import { RouterTestingModule } from '@angular/router/testing';

describe('ApproveComponent', () => {
  let component: ApproveComponent;
  let fixture: ComponentFixture<ApproveComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
        imports: [
          MatDividerModule,
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
