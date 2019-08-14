/// <reference types="chrome"/>

import { Component, NgZone } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BackgroundService } from './services/background.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(
    private zone: NgZone,
    private backgroundService: BackgroundService,
    private translate: TranslateService
  ) {
    translate.setDefaultLang('en');
    this.backgroundService.getLang()
      .subscribe(lang => this.zone.run(() => translate.use(lang)));
  }
}
