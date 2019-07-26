import { Component, OnInit, NgZone, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { analyzeAndValidateNgModules } from '@angular/compiler';

import { MatTabChangeEvent, MatSnackBar } from '@angular/material';
import { FormGroup, FormControl, Validators, ValidationErrors, AbstractControl } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { BackgroundService } from '../../services/background.service';

@Component({
  selector: 'app-generate',
  templateUrl: './generate.component.html',
  styleUrls: ['./generate.component.scss']
})
export class GenerateComponent implements OnInit {

  isGenerate = true;
  isAdvancedModeEnabled = false;

  passphraseControl = new FormControl('', [Validators.required, this.twelveWords]);
  isSavedControl = new FormControl('', [Validators.required]);

  seedVersionControl = new FormControl('Electrum1', [Validators.required]);
  seedVersions = ['Electrum1', 'Bip39'];
  seedLanguageControl = new FormControl('ENGLISH', [Validators.required]);
  languages = ['CHINESE', 'ENGLISH', 'FRENCH', 'ITALIAN', 'JAPANESE', 'KOREAN', 'SPANISH'];

  basePathControl = new FormControl('m/0\'/0/', [Validators.required]);

  generateForm = new FormGroup({
    seedVersion: this.seedVersionControl,
    seedLanguage: this.seedLanguageControl,
    basePath: this.basePathControl,
    passphrase: this.passphraseControl,
    isSaved: this.isSavedControl
  });

  twelveWords(control: AbstractControl): ValidationErrors | null {
    const twelve = control.value.split(' ').length === 12 || control.value.split('　').length === 12;
    const noVal = control.value === '';
    return noVal || twelve ? null : {'twelveWords': true};
  }

  constructor(
    private zone: NgZone,
    private router: Router,
    private route: ActivatedRoute,
    public snackBar: MatSnackBar,
    private backgroundService: BackgroundService
  ) { }

  ngOnInit() {
    this.generateRandomMnemonic();

    this.backgroundService.isAdvancedModeEnabled()
      .subscribe(isAdvancedModeEnabled => this.isAdvancedModeEnabled = isAdvancedModeEnabled);
  }

  generateRandomMnemonic(): void {
    this.backgroundService.generateRandomMnemonic(this.seedVersionControl.value, this.seedLanguageControl.value)
      .subscribe(mnemonic => this.passphraseControl.setValue(mnemonic));
  }

  tabChanged(tabChangeEvent: MatTabChangeEvent): void {
    this.isSavedControl.setValue(false);
    switch (tabChangeEvent.index) {
      case 0:
        this.isGenerate = true;
        this.generateRandomMnemonic();
        break;
      case 1:
        this.isGenerate = false;
        this.passphraseControl.setValue('');
        break;
    }
  }

  versionChanged(): void {
    switch (this.seedVersionControl.value) {
      case 'Electrum1':
        this.basePathControl.setValue('m/0\'/0/');
        break;
      case 'Bip39':
        this.basePathControl.setValue('m/44\'/22\'/0\'/0/');
        break;
    }

    if (this.isGenerate) {
      this.generateRandomMnemonic();
    }
  }

  savePassphrase(): void {
    this.backgroundService.saveNewPassphrase(this.passphraseControl.value, this.seedVersionControl.value, this.basePathControl.value)
      .subscribe({
        next: () => this.zone.run(() => this.router.navigate(['/home'])),
        error: error => {
          this.zone.run(() => {
            this.snackBar.open(error.toString(), '', {duration: 3000});
            this.router.navigate(['/term']);
          });
        }
      });
  }
}
