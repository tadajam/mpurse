import { Component, OnInit, NgZone } from '@angular/core';
import { BackgroundService } from '../../services/background.service';
import { Router } from '@angular/router';
import { flatMap, map } from 'rxjs/operators';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import { PasswordErrorStateMatcher } from '../register/register.component';
import { MatSnackBar } from '@angular/material';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

  existsVault = false;
  isUnlocked = false;

  langControl = new FormControl('', [Validators.required]);
  languages = [{langString: 'ENGLISH', langValue: 'en'}, {langString: 'JAPANESE', langValue: 'ja'}];

  advancedModeToggleControl = new FormControl(false, [Validators.required]);

  hide = true;
  passwordControl = new FormControl('', [Validators.required]);
  seedVersionString = '';
  basePath = '';
  passphrase = '';

  canPurgeAll = new FormControl('', [Validators.required]);

  constructor(
    private zone: NgZone,
    private router: Router,
    public snackBar: MatSnackBar,
    private backgroundService: BackgroundService,
    private translate: TranslateService
  ) { }

  ngOnInit() {
    this.backgroundService.isUnlocked()
      .subscribe(isUnlocked => this.isUnlocked = isUnlocked);

    this.backgroundService.existsVault()
      .subscribe(existsVault => this.existsVault = existsVault);

    this.backgroundService.getLang()
      .subscribe(lang => this.langControl.setValue(lang));

    this.backgroundService.isAdvancedModeEnabled()
      .subscribe(isAdvancedModeEnabled => this.advancedModeToggleControl.setValue(isAdvancedModeEnabled));
  }

  langChanged(): void {
    this.backgroundService.setLang(this.langControl.value)
      .subscribe({
        next: message => this.zone.run(() => {
          this.translate.use(this.langControl.value);
          this.snackBar.open(this.translate.instant('settings.settingsChanged'), '', {duration: 3000});
        }),
        error: error => this.zone.run(() => this.snackBar.open(error.toString(), '', {duration: 3000}))
      });
  }

  advancedModeChanged(): void {
    this.backgroundService.setAdvancedMode(this.advancedModeToggleControl.value)
      .subscribe({
        next: message => this.zone.run(() => this.snackBar.open(this.translate.instant('settings.settingsChanged'), '', {duration: 3000})),
        error: error => this.zone.run(() => this.snackBar.open(error.toString(), '', {duration: 3000}))
      });
  }

  revealPassphrase(): void {
    this.backgroundService.getHdkey(this.passwordControl.value)
      .subscribe(
        hdkey => {
          if (hdkey) {
            this.zone.run(() => {
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
            this.passwordControl.setValue('');
          } else {
            this.passphrase = '';
            this.passwordControl.setValue('');
            this.zone.run(() => this.snackBar.open(this.translate.instant('settings.invalidPassword'), '', {duration: 3000}));
          }
        });
  }

  copyPassphrase() {
    const textarea = document.createElement('textarea');
    textarea.style.position = 'fixed';
    textarea.style.left = '0';
    textarea.style.top = '0';
    textarea.style.opacity = '0';
    textarea.value = this.passphrase;
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);

    this.snackBar.open(this.translate.instant('settings.copied'), '', {duration: 2000});
  }

  purgeAll() {
    this.backgroundService.purgeAll()
      .subscribe({
        next: () => this.zone.run(() => this.router.navigate(['/term'])),
        error: error => this.zone.run(() => this.snackBar.open(error.toString(), '', {duration: 3000}))
      });
  }
}
