import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PrivateKeyGuard } from './guards/private-key.guard';
import { HomeComponent } from './components/home/home.component';
import { TermsComponent } from './components/terms/terms.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { GenerateComponent } from './components/generate/generate.component';
import { AddAccountComponent } from './components/add-account/add-account.component';
import { RemoveAccountComponent } from './components/remove-account/remove-account.component';
import { SettingsComponent } from './components/settings/settings.component';
import { InfomationComponent } from './components/infomation/infomation.component';
import { DetailsComponent } from './components/details/details.component';
import { SendComponent } from './components/send/send.component';
import { SignatureComponent } from './components/signature/signature.component';
import { ApproveComponent } from './components/approve/approve.component';
import { TransactionComponent } from './components/transaction/transaction.component';

const routes: Routes = [
  { path: 'home', component: HomeComponent, canActivate: [PrivateKeyGuard] },
  { path: 'term', component: TermsComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'generate', component: GenerateComponent },
  { path: 'add', component: AddAccountComponent },
  { path: 'remove', component: RemoveAccountComponent },
  { path: 'details', component: DetailsComponent },
  { path: 'settings', component: SettingsComponent},
  { path: 'info', component: InfomationComponent},
  { path: 'send', component: SendComponent },
  { path: 'signature', component: SignatureComponent},
  { path: 'transaction', component: TransactionComponent},
  { path: 'approve', component: ApproveComponent},
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', component: HomeComponent, canActivate: [PrivateKeyGuard] }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {onSameUrlNavigation: 'reload'})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
