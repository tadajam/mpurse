import { Component, OnInit, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material';
import { BackgroundService } from '../../services/background.service';
import { flatMap, filter, tap, map } from 'rxjs/operators';
import { DomSanitizer } from '@angular/platform-browser';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-signature',
  templateUrl: './signature.component.html',
  styleUrls: ['./signature.component.scss']
})
export class SignatureComponent implements OnInit {

  request = false;
  id = 0;
  origin = '';

  name = '';
  address = '';
  trustSvg;

  messageControl = new FormControl('', [Validators.required]);
  signatureControl = new FormControl('', []);

  signatureForm = new FormGroup({
    message: this.messageControl,
    signature: this.signatureControl
  });

  constructor(
    private zone: NgZone,
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer,
    public snackBar: MatSnackBar,
    private backgroundService: BackgroundService,
    private translate: TranslateService
  ) { }

  ngOnInit() {
    this.route.queryParams
      .pipe(
        filter(params => params.request),
        tap(params => this.request = true),
        flatMap(params => this.backgroundService.getPendingRequest(params.id)),
        filter(request => request)
      )
      .subscribe(request => {
        this.zone.run(() => {
          this.id = request.id;
          this.origin = request.origin;
          this.messageControl.setValue(request.data.message);
        });
      });

    this.backgroundService.getSelectedAddress()
      .pipe(
        flatMap(address => this.backgroundService.getAccountSummary(address)),
        map(accountSummary => {
          this.name = accountSummary.name;
          this.address = accountSummary.address;
          return accountSummary.address;
        }),
        flatMap(address => this.backgroundService.getIdentIcon(this.address))
      )
      .subscribe(svg => {
        this.zone.run(() => this.trustSvg = this.sanitizer.bypassSecurityTrustHtml(svg));
      });
  }

  copy() {
    const textarea = document.createElement('textarea');
    textarea.style.position = 'fixed';
    textarea.style.left = '0';
    textarea.style.top = '0';
    textarea.style.opacity = '0';
    textarea.value = this.signatureControl.value;
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);

    this.snackBar.open(this.translate.instant('signature.copied'), '', {duration: 2000});
  }

  sign() {
    if (this.request) {
      this.backgroundService.signMessage(this.messageControl.value)
        .pipe(flatMap(signature => this.backgroundService.shiftRequest(true, this.id, {signature: signature})))
        .subscribe({
          next: () => this.backgroundService.closeWindow(),
          error: error => this.zone.run(() => this.snackBar.open(error.toString(), '', {duration: 3000}))
        });
    } else {
      this.backgroundService.signMessage(this.messageControl.value)
        .subscribe({
          next: signature => this.zone.run(() => this.signatureControl.setValue(signature)),
          error: error => this.zone.run(() => this.snackBar.open(error.toString(), '', {duration: 3000}))
        });
    }
  }

  cancel() {
    if (this.request) {
      this.backgroundService.shiftRequest(false, this.id, {error: 'User Cancelled'})
      .subscribe({
        next: () => this.backgroundService.closeWindow(),
        error: error => this.zone.run(() => this.snackBar.open(error.toString(), '', {duration: 3000}))
      });
    } else {
      this.zone.run(() => this.router.navigate(['/home']));
    }
  }

}
