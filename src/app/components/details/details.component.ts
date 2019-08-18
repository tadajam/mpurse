import { Component, OnInit, NgZone } from '@angular/core';
import { BackgroundService } from '../../services/background.service';
import { map, filter, flatMap } from 'rxjs/operators';
import QRCode from 'qrcode';
import { from } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class DetailsComponent implements OnInit {
  name = '';
  address = '';
  trustSvg;
  addressQr: string;

  editing = false;
  nameControl = new FormControl('', [
    Validators.required,
    Validators.maxLength(15)
  ]);

  hide = true;
  passwordControl = new FormControl('', [Validators.required]);
  privatekey = '';

  constructor(
    private zone: NgZone,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    public snackBar: MatSnackBar,
    private backgroundService: BackgroundService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.route.queryParams
      .pipe(
        filter(params => params.name || params.address),
        map(params => {
          this.name = params.name;
          this.address = params.address;

          this.nameControl.setValue(params.name);

          return this.address;
        }),
        flatMap(address => {
          return this.backgroundService.getIdentIcon(this.address).pipe(
            map((svg: string) => {
              this.zone.run(
                () =>
                  (this.trustSvg = this.sanitizer.bypassSecurityTrustHtml(svg))
              );
              return address;
            })
          );
        }),
        flatMap(() => {
          return from<string>(
            QRCode.toDataURL(this.address, { errorCorrectionLevel: 'H' })
          );
        })
      )
      .subscribe({
        next: qrObj => {
          this.zone.run(() => (this.addressQr = qrObj));
        }
      });
  }

  viewMpchain(): void {
    this.backgroundService.viewNewTab(
      'https://mpchain.info/address/' + this.address
    );
  }

  copyPrivatekey(): void {
    const textarea = document.createElement('textarea');
    textarea.style.position = 'fixed';
    textarea.style.left = '0';
    textarea.style.top = '0';
    textarea.style.opacity = '0';
    textarea.value = this.privatekey;
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);

    this.snackBar.open(this.translate.instant('details.copied'), '', {
      duration: 2000
    });
  }

  revealPrivatekey(): void {
    this.backgroundService
      .getPrivatekey(this.passwordControl.value, this.address)
      .subscribe(privatekey => {
        if (privatekey !== '') {
          this.zone.run(() => (this.privatekey = privatekey));
          this.passwordControl.setValue('');
        } else {
          this.privatekey = '';
          this.passwordControl.setValue('');
          this.zone.run(() =>
            this.snackBar.open(
              this.translate.instant('details.invalidPassword'),
              '',
              { duration: 3000 }
            )
          );
        }
      });
  }

  setAccountName(): void {
    this.editing = false;
    this.backgroundService
      .setAccountName(this.address, this.nameControl.value)
      .subscribe({
        next: () => {
          this.zone.run(() => {
            this.name = this.nameControl.value;
          });
        },
        error: error => {
          this.zone.run(() => {
            this.nameControl.setValue(this.name);
            this.snackBar.open(error.toString(), '', { duration: 3000 });
          });
        }
      });
  }
}
