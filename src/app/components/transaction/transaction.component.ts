import { Component, OnInit, NgZone } from '@angular/core';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material';
import { BackgroundService } from '../../services/background.service';
import { filter, tap, flatMap, map } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-transaction',
  templateUrl: './transaction.component.html',
  styleUrls: ['./transaction.component.scss']
})
export class TransactionComponent implements OnInit {
  request = false;
  id = 0;
  origin = '';
  send = false;

  name = '';
  address = '';
  trustSvg: SafeHtml | undefined;

  rawControl = new FormControl('', [Validators.required]);
  signedControl = new FormControl('', []);

  signatureForm = new FormGroup({
    raw: this.rawControl,
    signed: this.signedControl
  });

  constructor(
    private zone: NgZone,
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer,
    public snackBar: MatSnackBar,
    private backgroundService: BackgroundService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.route.queryParams
      .pipe(
        filter(params => params.request),
        tap(() => (this.request = true)),
        flatMap(params => this.backgroundService.getPendingRequest(params.id)),
        filter(request => request)
      )
      .subscribe(request => {
        this.zone.run(() => {
          this.id = request.id;
          this.origin = request.origin;
          this.send = request.type === 'mpurse.send.tx.raw';
          this.rawControl.setValue(request.data.tx);
        });
      });

    this.backgroundService
      .getSelectedAddress()
      .pipe(
        flatMap(address => this.backgroundService.getAccountSummary(address)),
        map(accountSummary => {
          this.name = accountSummary.name;
          this.address = accountSummary.address;
          return accountSummary.address;
        }),
        flatMap(address => this.backgroundService.getIdentIcon(address))
      )
      .subscribe(svg => {
        this.zone.run(
          () => (this.trustSvg = this.sanitizer.bypassSecurityTrustHtml(svg))
        );
      });
  }

  copy(): void {
    const textarea = document.createElement('textarea');
    textarea.style.position = 'fixed';
    textarea.style.left = '0';
    textarea.style.top = '0';
    textarea.style.opacity = '0';
    textarea.value = this.signedControl.value;
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);

    this.snackBar.open(this.translate.instant('settings.copied'), '', {
      duration: 2000
    });
  }

  sign(): void {
    if (this.request) {
      if (this.send) {
        this.backgroundService
          .sendRawTransaction(this.rawControl.value)
          .pipe(
            flatMap(result =>
              this.backgroundService.shiftRequest(true, this.id, {
                txHash: result.tx_hash
              })
            )
          )
          .subscribe({
            next: () => this.backgroundService.closeWindow(),
            error: error =>
              this.zone.run(() =>
                this.snackBar.open(
                  this.backgroundService.interpretError(error),
                  '',
                  { duration: 3000 }
                )
              )
          });
      } else {
        this.backgroundService
          .signRawTransaction(this.rawControl.value)
          .pipe(
            flatMap(signedTx =>
              this.backgroundService.shiftRequest(true, this.id, {
                signedTx: signedTx
              })
            )
          )
          .subscribe({
            next: () => this.backgroundService.closeWindow(),
            error: error =>
              this.zone.run(() =>
                this.snackBar.open(error.toString(), '', { duration: 3000 })
              )
          });
      }
    } else {
      this.backgroundService
        .signRawTransaction(this.rawControl.value)
        .subscribe({
          next: signedTx =>
            this.zone.run(() => this.signedControl.setValue(signedTx)),
          error: error =>
            this.zone.run(() =>
              this.snackBar.open(error.toString(), '', { duration: 3000 })
            )
        });
    }
  }

  cancel(): void {
    if (this.request) {
      this.backgroundService
        .shiftRequest(false, this.id, { error: 'User Cancelled' })
        .subscribe({
          next: () => this.backgroundService.closeWindow(),
          error: error =>
            this.zone.run(() =>
              this.snackBar.open(error.toString(), '', { duration: 3000 })
            )
        });
    } else {
      this.zone.run(() => this.router.navigate(['/home']));
    }
  }
}
