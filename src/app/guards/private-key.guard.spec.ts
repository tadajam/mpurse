import { TestBed, async, inject } from '@angular/core/testing';

import { PrivateKeyGuard } from './private-key.guard';
import { RouterTestingModule } from '@angular/router/testing';

describe('PrivateKeyGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ RouterTestingModule ],
      providers: [PrivateKeyGuard]
    });
  });

  it('should ...', inject([PrivateKeyGuard], (guard: PrivateKeyGuard) => {
    expect(guard).toBeTruthy();
  }));
});
