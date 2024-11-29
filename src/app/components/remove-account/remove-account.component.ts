import { Component, OnInit, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
const jazzicon = require('jazzicon');
import { DomSanitizer } from '@angular/platform-browser';
import { BackgroundService } from '../../services/background.service';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-remove-account',
  templateUrl: './remove-account.component.html',
  styleUrls: ['./remove-account.component.scss']
})
export class RemoveAccountComponent implements OnInit {
  name = '';
  address = '';
  trustSvg;

  constructor(
    private zone: NgZone,
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer,
    public snackBar: MatSnackBar,
    private backgroundService: BackgroundService
  ) {}

  ngOnInit(): void {
    this.route.queryParams
      .pipe(filter(params => params.name || params.address))
      .subscribe(params => {
        this.name = params.name;
        this.address = params.address;
        this.setIdentIcon(this.address);
      });
  }

  setIdentIcon(address: string): void {
    if (address === '') {
      this.zone.run(() => (this.trustSvg = null));
    } else {
      this.backgroundService.decodeBase58(address).subscribe(bytes => {
        let hex = '';
        for (let i = 0; i < bytes.length; i++) {
          if (bytes[i] < 16) {
            hex += '0';
          }
          hex += bytes[i].toString(16);
        }
        const identicon = jazzicon(38, parseInt(hex.slice(0, 16), 16));
        this.zone.run(
          () =>
            (this.trustSvg = this.sanitizer.bypassSecurityTrustHtml(
              identicon.innerHTML
            ))
        );
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/home']);
  }

  removeAccount(): void {
    this.backgroundService.removeAccount(this.address).subscribe({
      next: () => this.zone.run(() => this.router.navigate(['/home'])),
      error: error =>
        this.zone.run(() =>
          this.snackBar.open(error.toString(), '', { duration: 3000 })
        )
    });
  }
}
