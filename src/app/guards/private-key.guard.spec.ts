import { TestBed, async, inject } from '@angular/core/testing';

import { PrivateKeyGuard } from './private-key.guard';

describe('PrivateKeyGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PrivateKeyGuard]
    });
  });

  it('should ...', inject([PrivateKeyGuard], (guard: PrivateKeyGuard) => {
    expect(guard).toBeTruthy();
  }));
});
