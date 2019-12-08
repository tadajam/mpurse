import { Component, OnInit, NgZone } from '@angular/core';
import { BackgroundService } from '../../services/background.service';
import { Router } from '@angular/router';
import { FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  existsVault = false;
  isUnlocked = false;

  langControl = new FormControl('', [Validators.required]);
  languages = [
    { langString: 'ENGLISH', langValue: 'en' },
    { langString: 'JAPANESE', langValue: 'ja' }
  ];

  advancedModeToggleControl = new FormControl(false, [Validators.required]);

  canPurgeAll = new FormControl('', [Validators.required]);

  constructor(
    private zone: NgZone,
    private router: Router,
    public snackBar: MatSnackBar,
    private backgroundService: BackgroundService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.backgroundService
      .isUnlocked()
      .subscribe(isUnlocked => (this.isUnlocked = isUnlocked));

    this.backgroundService
      .existsVault()
      .subscribe(existsVault => (this.existsVault = existsVault));

    this.backgroundService
      .getLang()
      .subscribe(lang => this.langControl.setValue(lang));

    this.backgroundService
      .isAdvancedModeEnabled()
      .subscribe(isAdvancedModeEnabled =>
        this.advancedModeToggleControl.setValue(isAdvancedModeEnabled)
      );
  }

  langChanged(): void {
    this.backgroundService.setLang(this.langControl.value).subscribe({
      next: () =>
        this.zone.run(() => {
          this.translate.use(this.langControl.value);
          this.snackBar.open(
            this.translate.instant('settings.settingsChanged'),
            '',
            { duration: 3000 }
          );
        }),
      error: error =>
        this.zone.run(() =>
          this.snackBar.open(error.toString(), '', { duration: 3000 })
        )
    });
  }

  advancedModeChanged(): void {
    this.backgroundService
      .setAdvancedMode(this.advancedModeToggleControl.value)
      .subscribe({
        next: () =>
          this.zone.run(() =>
            this.snackBar.open(
              this.translate.instant('settings.settingsChanged'),
              '',
              { duration: 3000 }
            )
          ),
        error: error =>
          this.zone.run(() =>
            this.snackBar.open(error.toString(), '', { duration: 3000 })
          )
      });
  }

  purgeAll(): void {
    this.backgroundService.purgeAll().subscribe({
      next: () => this.zone.run(() => this.router.navigate(['/term'])),
      error: error =>
        this.zone.run(() =>
          this.snackBar.open(error.toString(), '', { duration: 3000 })
        )
    });
  }
}
