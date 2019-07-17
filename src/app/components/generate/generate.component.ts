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

  passphraseControl = new FormControl('', [Validators.required, this.twelveWords]);
  isSavedControl = new FormControl('', [Validators.required]);

  generateForm = new FormGroup({
    passphrase: this.passphraseControl,
    isSaved: this.isSavedControl
  });

  twelveWords(control: AbstractControl): ValidationErrors | null {
    const twelve = control.value.split(' ').length === 12;
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
  }

  // Electrum Seed Version 1
  generateRandomMnemonic(): void {
    this.backgroundService.generateRandomMnemonic()
      .subscribe(mnemonic => this.passphraseControl.setValue(mnemonic));
  }

  // Bip39
  // generateRandomBip39Mnemonic() {
  //   this.backgroundService.generateRandomBip39Mnemonic()
  //     .subscribe(mnemonic => this.passphraseControl.setValue(mnemonic));
  // }

  tabChanged(tabChangeEvent: MatTabChangeEvent): void {
    this.isSavedControl.setValue(false);
    switch (tabChangeEvent.index) {
      case 0:
        this.generateRandomMnemonic();
        break;
      case 1:
        this.passphraseControl.setValue('');
        break;
    }
  }

  savePassphrase(): void {
    this.backgroundService.saveNewPassphrase(this.passphraseControl.value, 'Electrum1', 'm/0\'/0/')
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
