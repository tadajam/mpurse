import { Component, OnInit, NgZone, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { BackgroundService } from '../../services/background.service';
import { MatSnackBar } from '@angular/material';
import { Decimal } from 'decimal.js';
import { flatMap, filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

interface Account {
  index: number;
  address: string;
  balances: {
    asset: string;
    asset_longname: string;
    description: string;
    estimated_value: {
      mona: string;
      usd: string;
      xmp: string;
    };
    quantity: string;
    unconfirmed_quantity?: string;
  }[];
}

interface AccountSummary {
  address: string;
  name: string;
  isImport: boolean;
  mona_balance: string;
  unconfirmed_mona_balance: string;
  xmp_balance: string;
  unconfirmed_xmp_balance: string;
  assets: {
    held: number;
    owned: number;
  };
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  pageLimit = 10;

  page = 1;
  assetsTotal = 0;

  loading = true;

  private subscriptions = new Subscription();

  accountSummary: AccountSummary = {
    address: '',
    name: '',
    isImport: false,
    mona_balance: '',
    unconfirmed_mona_balance: '',
    unconfirmed_xmp_balance: '',
    xmp_balance: '',
    assets: { held: 0, owned: 0 }
  };

  assets: {
    asset: string;
    asset_longname: string;
    description: string;
    estimated_value: { mona: string; usd: string; xmp: string };
    quantity: string;
    unconfirmed_quantity: string;
  }[] = [];

  constructor(
    private zone: NgZone,
    private router: Router,
    public snackBar: MatSnackBar,
    private backgroundService: BackgroundService,
    private translate: TranslateService
  ) {
    this.subscriptions.add(
      this.router.events
        .pipe(
          filter(event => event instanceof NavigationEnd),
          flatMap(() => this.backgroundService.getSelectedAddress()),
          filter(
            address =>
              this.accountSummary.address === '' ||
              address === this.accountSummary.address
          ),
          flatMap(address => this.backgroundService.getAccountSummary(address))
        )
        .subscribe({
          next: accountSummary => {
            this.zone.run(() => {
              this.accountSummary = accountSummary;
              this.page = 1;
              this.getBalances(0);
            });
          },
          error: error => {
            this.zone.run(() => {
              this.snackBar.open(error.toString(), '', { duration: 3000 });
            });
          }
        })
    );
  }

  ngOnInit(): void {
    this.backgroundService
      .getPendingRequest()
      .pipe(filter(request => request))
      .subscribe(request => {
        this.zone.run(() =>
          this.router.navigate(['/' + request.target], {
            queryParams: { request: true, id: request.id }
          })
        );
      });

    this.subscriptions.add(
      this.backgroundService.unlockState.subscribe(isUnlocked => {
        if (!isUnlocked) {
          this.zone.run(() => this.router.navigate(['/login']));
        }
      })
    );

    this.subscriptions.add(
      this.backgroundService.selectedAddressState
        .pipe(
          flatMap(address => this.backgroundService.getAccountSummary(address))
        )
        .subscribe({
          next: accountSummary => {
            this.zone.run(() => {
              this.accountSummary = accountSummary;
              this.page = 1;
              this.getBalances(0);
            });
          },
          error: error => {
            this.zone.run(() => {
              this.snackBar.open(error.toString(), '', { duration: 3000 });
            });
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  getBalances(target: number): void {
    this.loading = true;
    this.page += target;

    this.backgroundService
      .getBalances(this.accountSummary.address, this.page, this.pageLimit)
      .subscribe({
        next: balances => {
          this.zone.run(() => {
            this.assetsTotal = balances.total;
            this.assets = balances.data;
            this.loading = false;
          });
        },
        error: error => {
          this.zone.run(() => {
            this.snackBar.open(error.toString(), '', { duration: 3000 });
          });
        }
      });
  }

  maxPage(): number {
    return Math.ceil(this.assetsTotal / this.pageLimit);
  }

  shortenAddress(): string {
    let str = this.accountSummary.address.substr(0, 6) + '...';
    str += this.accountSummary.address.substr(
      this.accountSummary.address.length - 4,
      4
    );
    return str;
  }

  copyAddress(): void {
    const textarea = document.createElement('textarea');
    textarea.style.position = 'fixed';
    textarea.style.left = '0';
    textarea.style.top = '0';
    textarea.style.opacity = '0';
    textarea.value = this.accountSummary.address;
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);

    this.snackBar.open(this.translate.instant('home.copied'), '', {
      duration: 2000
    });
  }

  lock(): void {
    this.backgroundService.lock().subscribe({
      error: error =>
        this.zone.run(() =>
          this.snackBar.open(error.toString(), '', { duration: 3000 })
        )
    });
  }

  viewMpchain(): void {
    this.backgroundService.viewNewTab(
      'https://mpchain.info/address/' + this.accountSummary.address
    );
  }

  viewInsight(): void {
    this.backgroundService.viewNewTab(
      'https://mona.insight.monaco-ex.org/insight/address/' +
        this.accountSummary.address
    );
  }

  reflectUnconfirmed(confirmed: string, unconfirmed: string): number {
    return new Decimal(confirmed).plus(new Decimal(unconfirmed)).toNumber();
  }

  isDivisible(quantity: string): boolean {
    return quantity.includes('.');
  }
}
