import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormControl, Validators, ValidationErrors, AbstractControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { BackgroundService } from '../../services/background.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  hide = true;
  passwordControl = new FormControl('', [Validators.required]);

  constructor(
    private zone: NgZone,
    private router: Router,
    public snackBar: MatSnackBar,
    private backgroundService: BackgroundService
  ) { }

  ngOnInit() {
    // this.passwordControl.setValue('');
  }

  unlock() {
    this.backgroundService.unlock(this.passwordControl.value)
      .subscribe({
        next: () => this.zone.run(() => this.router.navigate(['/home'])),
        error: error => {
          this.zone.run(() => {
            this.passwordControl.setValue('');
            this.snackBar.open(error.toString(), '', {duration: 3000});
          });
        }
      });
  }

}
