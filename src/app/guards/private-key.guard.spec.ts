import { TestBed, async, inject } from '@angular/core/testing';

import { PrivateKeyGuard } from './private-key.guard';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { createTranslateLoader } from '../app.module';

describe('PrivateKeyGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule,
        HttpClientModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: createTranslateLoader,
            deps: [HttpClient]
          }
        })
      ],
      providers: [PrivateKeyGuard]
    });
  });

  it('should ...', inject([PrivateKeyGuard], (guard: PrivateKeyGuard) => {
    expect(guard).toBeTruthy();
  }));
});
