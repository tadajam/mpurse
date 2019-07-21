import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InfomationComponent } from './infomation.component';
import { MatDividerModule } from '@angular/material';
import { RouterModule } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('InfomationComponent', () => {
  let component: InfomationComponent;
  let fixture: ComponentFixture<InfomationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ MatDividerModule, RouterModule, BrowserAnimationsModule ],
      declarations: [ InfomationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InfomationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
