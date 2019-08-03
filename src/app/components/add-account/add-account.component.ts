import { Component, OnInit, NgZone } from '@angular/core';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { map, filter, flatMap, first } from 'rxjs/operators';
import { BackgroundService } from '../../services/background.service';
import { MatSnackBar } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-add-account',
  templateUrl: './add-account.component.html',
  styleUrls: ['./add-account.component.scss']
})
export class AddAccountComponent implements OnInit {

  selected = 0;
  nameFormControl = new FormControl('');
  privatekeyFormControl = new FormControl('', [Validators.required]);

  importForm = new FormGroup({
    name: this.nameFormControl,
    privatekey: this.privatekeyFormControl
  });

  constructor(
    private zone: NgZone,
    private router: Router,
    private route: ActivatedRoute,
    public snackBar: MatSnackBar,
    private backgroundService: BackgroundService,
    private translate: TranslateService
  ) { }

  ngOnInit() {
    this.route.queryParams
      .pipe(filter(params => params.selected))
      .subscribe(params => this.selected = params.selected);

    this.backgroundService.incrementAccountName(this.translate.instant('addAccount.account'), 1)
      .subscribe(name => this.nameFormControl.setValue(name));
  }

  createAccount() {
    this.backgroundService.createAccount(this.nameFormControl.value)
      .subscribe({
        next: () => this.zone.run(() => this.router.navigate(['/home'])),
        error: error => {
          this.zone.run(() => {
            this.snackBar.open(error.toString(), '', {duration: 3000});
          });
        }
      });
  }

  importAccount() {
    this.backgroundService.importAccount(this.privatekeyFormControl.value, this.nameFormControl.value)
      .subscribe({
        next: () => this.zone.run(() => this.router.navigate(['/home'])),
        error: error => {
          this.zone.run(() => {
            this.snackBar.open(error.toString(), '', {duration: 3000});
          });
        }
      });
  }

}
