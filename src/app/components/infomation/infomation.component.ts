import { Component, OnInit } from '@angular/core';
import { BackgroundService } from '../../services/background.service';

@Component({
  selector: 'app-infomation',
  templateUrl: './infomation.component.html',
  styleUrls: ['./infomation.component.scss']
})
export class InfomationComponent implements OnInit {

  isUnlocked = false;

  constructor(
    private backgroundService: BackgroundService
  ) { }

  ngOnInit() {
    this.backgroundService.isUnlocked()
      .subscribe(isUnlocked => this.isUnlocked = isUnlocked);
  }

  viewNewTab(url: string) {
    chrome.tabs.create({url: url});
  }
}
