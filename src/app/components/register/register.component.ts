import { Component, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import {
  FormGroup,
  FormControl,
  Validators,
  FormGroupDirective,
  NgForm
} from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { ErrorStateMatcher } from '@angular/material/core';
import { BackgroundService } from '../../services/background.service';

export class PasswordErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: FormControl | null,
    form: FormGroupDirective | NgForm | null
  ): boolean {
    const invalidCtrl = !!(control && control.invalid && control.parent.dirty);
    const invalidParent = !!(
      control &&
      control.parent &&
      control.parent.invalid &&
      control.parent.dirty
    );

    return invalidCtrl || invalidParent;
  }
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  passwordControl = new FormControl('', [
    Validators.required,
    Validators.minLength(8)
  ]);
  confirmPasswordControl = new FormControl('', []);

  registerForm = new FormGroup(
    {
      password: this.passwordControl,
      confirmPassword: this.confirmPasswordControl
    },
    { validators: this.checkPasswords }
  );

  matcher = new PasswordErrorStateMatcher();

  hide = true;

  constructor(
    private zone: NgZone,
    private router: Router,
    public snackBar: MatSnackBar,
    private backgroundService: BackgroundService
  ) {}

  checkPasswords(group: FormGroup): { [key: string]: any } | null {
    const pass = group.controls.password.value;
    const confirmPass = group.controls.confirmPassword.value;

    return pass === confirmPass ? null : { notMatch: true };
  }

  register(): void {
    this.backgroundService.register(this.passwordControl.value).subscribe({
      next: () => this.zone.run(() => this.router.navigate(['/generate'])),
      error: error =>
        this.zone.run(() =>
          this.snackBar.open(error.toString(), '', { duration: 3000 })
        )
    });
  }
}
