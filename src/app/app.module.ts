import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TermsComponent } from './components/terms/terms.component';
import { HomeComponent } from './components/home/home.component';
import { RegisterComponent } from './components/register/register.component';
import { GenerateComponent } from './components/generate/generate.component';
import { LoginComponent } from './components/login/login.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppMaterialModule } from './material/app.material.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MenuButtonComponent } from './components/menu-button/menu-button.component';
import { BackgroundService } from './services/background.service';
import { AddAccountComponent } from './components/add-account/add-account.component';
import { RemoveAccountComponent } from './components/remove-account/remove-account.component';
import { SettingsComponent } from './components/settings/settings.component';
import { InfomationComponent } from './components/infomation/infomation.component';
import { DetailsComponent } from './components/details/details.component';
import { SendComponent } from './components/send/send.component';
import { SignatureComponent } from './components/signature/signature.component';
import { ApproveComponent } from './components/approve/approve.component';
import { TransactionComponent } from './components/transaction/transaction.component';

@NgModule({
  declarations: [
    AppComponent,
    TermsComponent,
    HomeComponent,
    RegisterComponent,
    GenerateComponent,
    LoginComponent,
    MenuButtonComponent,
    AddAccountComponent,
    RemoveAccountComponent,
    SettingsComponent,
    InfomationComponent,
    DetailsComponent,
    SendComponent,
    SignatureComponent,
    ApproveComponent,
    TransactionComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    AppMaterialModule,
    FlexLayoutModule
  ],
  providers: [BackgroundService],
  bootstrap: [AppComponent]
})
export class AppModule { }
