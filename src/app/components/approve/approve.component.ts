import { Component, OnInit, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material';
import { BackgroundService } from '../../services/background.service';
import { flatMap, filter, map, tap } from 'rxjs/operators';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-approve',
  templateUrl: './approve.component.html',
  styleUrls: ['./approve.component.scss']
})
export class ApproveComponent implements OnInit {

  id = 0;
  origin = '';

  constructor(
    private zone: NgZone,
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer,
    public snackBar: MatSnackBar,
    private backgroundService: BackgroundService
  ) { }

  ngOnInit() {
    this.route.queryParams
      .pipe(
        filter(params => params.request),
        flatMap(params => this.backgroundService.getPendingRequest(params.id)),
        filter(request => request)
      )
      .subscribe(request => {
        this.zone.run(() => {
          this.id = request.id;
          this.origin = request.origin;
        });
      });
  }

  approve(): void {
    this.backgroundService.approveOrigin(this.origin, this.id)
      .subscribe({
        next: hasNext => {
          if (hasNext) {
            this.zone.run(() => this.router.navigate(['/home']));
          } else {
            this.backgroundService.closeWindow();
          }
        },
        error: error => this.zone.run(() => this.snackBar.open(error.toString(), '', {duration: 3000}))
      });
  }

  cancel(): void {
    this.backgroundService.shiftRequest(false, this.id, {error: 'User Cancelled'})
      .subscribe({
        next: () => this.backgroundService.closeWindow(),
        error: error => this.zone.run(() => this.snackBar.open(error.toString(), '', {duration: 3000}))
      });
  }

}
