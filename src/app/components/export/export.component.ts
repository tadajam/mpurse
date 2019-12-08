import { Component, OnInit, NgZone } from '@angular/core';
import { from } from 'rxjs';
import { BackgroundService } from 'src/app/services/background.service';
import { FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { filter, flatMap, tap } from 'rxjs/operators';
import QRCode from 'qrcode';

@Component({
  selector: 'app-export',
  templateUrl: './export.component.html',
  styleUrls: ['./export.component.scss']
})
export class ExportComponent implements OnInit {
  isSeed: boolean;

  privatekey: string;
  privatekeyQr: string;

  seedVersionString = '';
  basePath = '';
  passphrase: string;
  passphraseQr: string;

  hide = true;
  isAuthenticated = false;

  passwordControl = new FormControl('', [Validators.required]);

  constructor(
    private zone: NgZone,
    private route: ActivatedRoute,
    private backgroundService: BackgroundService,
    private snackBar: MatSnackBar,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(filter((params: ParamMap) => params.has('isSeed')))
      .subscribe({
        next: (params: ParamMap) =>
          (this.isSeed = params.get('isSeed') === 'true')
      });
  }

  revealSecret(): void {
    if (this.isSeed) {
      this.revealPassphrase();
    } else {
      this.revealPrivatekey();
    }
  }

  revealPrivatekey(): void {
    this.backgroundService
      .getSelectedAddress()
      .pipe(
        flatMap(address =>
          this.backgroundService.getPrivatekey(
            this.passwordControl.value,
            address
          )
        ),
        tap(privatekey => {
          if (privatekey === '') {
            this.privatekey = '';
            this.passwordControl.setValue('');
            this.zone.run(() =>
              this.snackBar.open(
                this.translate.instant('export.invalidPassword'),
                '',
                { duration: 3000 }
              )
            );
          }
        }),
        filter(privatekey => privatekey !== ''),
        flatMap(privatekey => {
          this.zone.run(() => {
            this.isAuthenticated = true;
            this.privatekey = privatekey;
          });
          this.passwordControl.setValue('');
          return from<string>(
            QRCode.toDataURL(privatekey, { errorCorrectionLevel: 'H' })
          );
        })
      )
      .subscribe({
        next: qrObj => {
          this.zone.run(() => (this.privatekeyQr = qrObj));
        }
      });
  }

  revealPassphrase(): void {
    this.backgroundService
      .getHdkey(this.passwordControl.value)
      .pipe(
        tap(hdkey => {
          if (hdkey === null) {
            this.passphrase = '';
            this.passwordControl.setValue('');
            this.zone.run(() =>
              this.snackBar.open(
                this.translate.instant('export.invalidPassword'),
                '',
                { duration: 3000 }
              )
            );
          }
        }),
        filter(hdkey => hdkey !== null),
        flatMap(hdkey => {
          this.zone.run(() => {
            this.isAuthenticated = true;
            this.passwordControl.setValue('');
            this.seedVersionString = hdkey.seedVersion;
            switch (hdkey.seedVersion) {
              case 'Electrum1':
                this.seedVersionString = 'Electrum Seed Version 1';
                break;
              case 'Bip39':
                this.seedVersionString = 'Bip39';
                break;
              default:
                this.seedVersionString = hdkey.seedVersion;
            }
            this.basePath = hdkey.basePath;
            this.passphrase = hdkey.mnemonic;
          });

          return from<string>(
            QRCode.toDataURL(hdkey.mnemonic, { errorCorrectionLevel: 'H' })
          );
        })
      )
      .subscribe({
        next: qrObj => {
          this.zone.run(() => (this.passphraseQr = qrObj));
        }
      });
  }

  copy(secret: string): void {
    const textarea = document.createElement('textarea');
    textarea.style.position = 'fixed';
    textarea.style.left = '0';
    textarea.style.top = '0';
    textarea.style.opacity = '0';
    textarea.value = secret;
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);

    this.snackBar.open(this.translate.instant('export.copied'), '', {
      duration: 2000
    });
  }
}
