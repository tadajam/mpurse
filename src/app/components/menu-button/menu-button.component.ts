import { Component, OnInit, NgZone, OnDestroy } from '@angular/core';
import { BackgroundService } from '../../services/background.service';
import * as jazzicon from 'jazzicon';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-menu-button',
  templateUrl: './menu-button.component.html',
  styleUrls: ['./menu-button.component.scss']
})
export class MenuButtonComponent implements OnInit, OnDestroy {
  buttonElement: any;
  existsVault = false;
  isUnlocked = false;
  trustSvg: SafeHtml | undefined;
  selectedAddress = '';
  identities: { address: string; name: string; isImport: boolean }[] = [];
  private subscriptions = new Subscription();

  constructor(
    private zone: NgZone,
    private router: Router,
    private sanitizer: DomSanitizer,
    public snackBar: MatSnackBar,
    private backgroundService: BackgroundService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.backgroundService.existsVaultState.subscribe(
        existsVault => (this.existsVault = existsVault)
      )
    );
    this.backgroundService
      .existsVault()
      .subscribe(existsVault => (this.existsVault = existsVault));

    this.subscriptions.add(
      this.backgroundService.unlockState.subscribe(
        isUnlocked => (this.isUnlocked = isUnlocked)
      )
    );
    this.backgroundService
      .isUnlocked()
      .subscribe(isUnlocked => (this.isUnlocked = isUnlocked));

    this.subscriptions.add(
      this.backgroundService.selectedAddressState.subscribe(address =>
        this.setIdentIcon(address)
      )
    );
    this.backgroundService
      .getSelectedAddress()
      .subscribe(address => this.setIdentIcon(address));

    this.subscriptions.add(
      this.backgroundService.identitiesState.subscribe(
        identities => (this.identities = identities)
      )
    );
    this.backgroundService
      .getIdentities()
      .subscribe(identities => (this.identities = identities));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  setIdentIcon(address: string): void {
    this.selectedAddress = address;
    if (address === '') {
      this.zone.run(() => (this.trustSvg = undefined));
    } else {
      this.backgroundService.decodeBase58(address).subscribe(bytes => {
        let hex = '';
        for (let i = 0; i < bytes.length; i++) {
          if (bytes[i] < 16) {
            hex += '0';
          }
          hex += bytes[i].toString(16);
        }
        const identicon = jazzicon(38, parseInt(hex.slice(0, 16), 16));
        this.trustSvg = this.sanitizer.bypassSecurityTrustHtml(
          identicon.innerHTML
        );
      });
    }
  }

  changeAddresses(address: string): void {
    this.backgroundService.changeAddress(address).subscribe({
      next: () => this.zone.run(() => this.router.navigate(['/home'])),
      error: error =>
        this.snackBar.open(error.toString(), '', { duration: 3000 })
    });
  }

  lock(): void {
    this.backgroundService.lock().subscribe({
      next: () => this.zone.run(() => this.router.navigate(['/login'])),
      error: error =>
        this.snackBar.open(error.toString(), '', { duration: 3000 })
    });
  }
}
