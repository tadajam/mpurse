import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-infomation',
  templateUrl: './infomation.component.html',
  styleUrls: ['./infomation.component.scss']
})
export class InfomationComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  viewNewTab(url: string) {
    chrome.tabs.create({url: url});
  }
}
