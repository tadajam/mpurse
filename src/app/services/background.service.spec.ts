import { TestBed } from '@angular/core/testing';

import { BackgroundService } from './background.service';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { createTranslateLoader } from '../app.module';

describe('BackgroundService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [
        HttpClientModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: createTranslateLoader,
            deps: [HttpClient]
          }
        })
      ]
    })
  );

  it('should be created', () => {
    const service: BackgroundService = TestBed.get(BackgroundService);
    expect(service).toBeTruthy();
  });
});
