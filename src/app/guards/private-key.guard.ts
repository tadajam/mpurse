import { Injectable, NgZone } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, filter, flatMap, first, tap } from 'rxjs/operators';
import { BackgroundService } from '../services/background.service';

@Injectable({
  providedIn: 'root'
})
export class PrivateKeyGuard implements CanActivate {

  constructor(
    private zone: NgZone,
    private router: Router,
    private backgroundService: BackgroundService
  ) { }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot)
    : Observable<boolean> | Promise<boolean> | boolean {
    return <boolean>Observable.create(observer => {
      this.backgroundService.existsVault()
        .pipe(
          tap(exists => {
            if (! exists) {
              this.zone.run(() => this.router.navigate(['/term']));
              observer.next(false);
            }
          }),
          filter(exists => exists),
          flatMap(() => {
            return this.backgroundService.isUnlocked();
          })
        )
        .subscribe(isUnlocked => {
          if (! isUnlocked) {
            this.zone.run(() => this.router.navigate(['/login']));
          }
          observer.next(isUnlocked);
        });
    }).pipe(first());
  }
}
