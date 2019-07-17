import { Injectable } from '@angular/core';
import { Subject, Observable, throwError, from } from 'rxjs';
import { map, filter, flatMap, first, tap } from 'rxjs/operators';
import { SafeHtml } from '@angular/platform-browser';
import * as jazzicon from 'jazzicon';

@Injectable({
  providedIn: 'root'
})
export class BackgroundService {

  private existsVaultSubject = new Subject<boolean>();
  existsVaultState = this.existsVaultSubject.asObservable();

  private unlockSubject = new Subject<boolean>();
  unlockState = this.unlockSubject.asObservable();

  private selectedAddressSubject = new Subject<string>();
  selectedAddressState = this.selectedAddressSubject.asObservable();

  private identitiesSubject = new Subject<{address: string, name: string, isImport: boolean}[]>();
  identitiesState = this.identitiesSubject.asObservable();

  constructor() {}

  private getBackground(): Observable<any> {
    return Observable.create(observer => {
      chrome.runtime.getBackgroundPage((backgroundPage: Window) => {
        observer.next((<any>backgroundPage).bg);
      });
    }).pipe(first());
  }

  isUnlocked(): Observable<boolean> {
    return this.getBackground()
      .pipe(map(bg => bg.getIsUnlocked()));
  }

  register(password: string): Observable<void> {
    return this.getBackground()
      .pipe(flatMap(bg => from<Observable<void>>(bg.unlock(password))));
  }

  unlock(password: string): Observable<void> {
    return this.getBackground()
      .pipe(
        flatMap(bg => from<Observable<void>>(bg.unlock(password))),
        tap(() => this.updateState())
      );
  }

  lock(): Observable<void> {
    return this.getBackground()
      .pipe(
        map(bg => bg.lock()),
        tap(() => this.updateState())
      );
  }

  getSelectedAddress(): Observable<string> {
    return this.getBackground()
      .pipe(map(bg => bg.getSelectedAddress()));
  }

  setAccountName(address: string, name: string): Observable<void> {
    return this.getBackground()
      .pipe(flatMap(bg => from<Observable<void>>(bg.setAccountName(address, name))));
  }

  getIdentities(): Observable<{address: string, name: string, isImport: boolean}[]> {
    return this.getBackground()
      .pipe(map(bg => bg.getIdentities()));
  }

  changeAddress(address: string): Observable<void> {
    return this.getBackground()
      .pipe(
        flatMap(bg => from<Observable<void>>(bg.setSelectedAddress(address))),
        tap(() => this.changeAddressState(address))
      );
  }

  saveNewPassphrase(passphrase: string, seedVersion: string, basePath: string): Observable<void> {
    return this.getBackground()
      .pipe(
        flatMap(bg => from<Observable<void>>(bg.saveNewPassphrase(passphrase, seedVersion, basePath))),
        tap(() => this.updateState())
      );
  }

  getPassphrase(password: string): Observable<string> {
    return this.getBackground()
      .pipe(
        map(bg => bg.getPassphrase(password))
      );
  }

  createAccount(name: string): Observable<void> {
    return this.getBackground()
      .pipe(
        flatMap(bg => from<Observable<void>>(bg.createAccount(name))),
        tap(() => this.updateState())
      );
  }

  importAccount(privatekey: string, name: string): Observable<void> {
    return this.getBackground()
      .pipe(
        flatMap(bg => from<Observable<void>>(bg.importAccount(privatekey, name))),
        tap(() => this.updateState())
      );
  }

  getPrivatekey(password: string, address: string): Observable<string> {
    return this.getBackground()
      .pipe(
        map(bg => bg.getPrivatekey(password, address))
      );
  }

  getPendingRequest(id?: number): Observable<any | null> {
    return this.getBackground()
      .pipe(map(bg => bg.getPendingRequest(id)));
  }

  shiftRequest(isSuccessful: boolean, id: number, result: any): Observable<void> {
    return this.getBackground()
      .pipe(flatMap(bg => from<Observable<void>>(bg.shiftRequest(isSuccessful, id, result))));
  }

  signRawTransaction(tx: string): Observable<string> {
    return this.getBackground()
      .pipe(flatMap(bg => from<Observable<string>>(bg.signRawTransaction(tx))));
  }

  signMessage(message: string): Observable<string> {
    return this.getBackground()
      .pipe(map(bg => bg.signMessage(message)));
  }

  sendRawTransaction(tx: string): Observable<any> {
    return this.getBackground()
      .pipe(flatMap(bg => from<Observable<any>>(bg.sendRawTransaction(tx))));
  }

  approveOrigin(origin: string, id: number): Observable<boolean> {
    return this.getBackground()
      .pipe(map(bg => bg.approveOrigin(origin, id)));
  }

  removeAccount(address: string): Observable<void> {
    return this.getBackground()
      .pipe(
        flatMap(bg => from<Observable<void>>(bg.removeAccount(address))),
        tap(() => this.updateState())
      );
  }

  incrementAccountName(name: string, num: number): Observable<string> {
    return this.getBackground()
      .pipe(map(bg => bg.incrementAccountName(name, num)));
  }

  isAdvancedModeEnabled(): Observable<boolean> {
    return this.getBackground()
      .pipe(map(bg => bg.isAdvancedModeEnabled()));
  }

  setAdvancedMode(isEnabled: boolean): Observable<void> {
    return this.getBackground()
      .pipe(flatMap(bg => from<Observable<void>>(bg.setAdvancedMode(isEnabled))));
  }

  purgeAll(): Observable<void> {
    return this.getBackground()
      .pipe(
        flatMap(bg => from<Observable<void>>(bg.purgeAll())),
        tap(() => this.updateState())
      );
  }

  existsVault(): Observable<boolean> {
    return this.getBackground().pipe(flatMap(bg => from<Observable<boolean>>(bg.existsVault())));
  }

  getAddressInfo(address: string): Observable<any> {
    return this.getBackground()
      .pipe(flatMap(bg => from<Observable<any>>(bg.getAddressInfo(address))));
  }

  getAsset(asset: string): Observable<any> {
    return this.getBackground()
      .pipe(flatMap(bg => from<Observable<any>>(bg.getAsset(asset))));
  }

  getAccountSummary(address: string): Observable<any> {
    let name = '';
    let isImport = false;
    return this.getBackground()
      .pipe(
        flatMap(bg => {
          const identity = bg.getIdentity(address);
          if (identity) {
            name = identity.name;
            isImport = identity.isImport;
          }

          return from<Observable<any>>(bg.getAddressInfo(address));
        }),
        map(addressInfo => {
          addressInfo['name'] = name;
          addressInfo['isImport'] = isImport;
          return addressInfo;
        }));
  }

  getIdentIcon(address: string): Observable<string> {
      return this.getBackground()
        .pipe(
          map(bg => {
            const bytes = bg.keyring.decodeBase58(address);
            let hex = '';
            for (let i = 0; i < bytes.length; i++) {
              if (bytes[i] < 16) {
                hex += '0';
              }
              hex += bytes[i].toString(16);
            }
            const identicon = jazzicon(38, parseInt(hex.slice(0, 16), 16));
            return identicon.innerHTML;
          })
        );
  }

  getBalances(address: string, page: number, limit: number): Observable<any> {
    return this.getBackground()
      .pipe(flatMap(bg => from<Observable<any>>(bg.getBalances(address, page, limit))));
  }

  createSend(source: string, destination: string, asset: string,
    quantity: number, memo: string, memo_is_hex: boolean, fee_per_kb: number, disableUtxoLocks: boolean): Observable<any> {
    return this.getBackground()
      .pipe(flatMap(bg => from<Observable<any>>(
        bg.createSend(source, destination, asset, quantity, memo, memo_is_hex, fee_per_kb, disableUtxoLocks))));
  }

  send(tx: string): Observable<any> {
    return this.getBackground()
      .pipe(flatMap(bg => from<Observable<any>>(bg.send(tx))));
  }

  updateState(): void {
    this.existsVault().subscribe(existsVault => this.changeExistsVaultState(existsVault));
    this.isUnlocked().subscribe(isUnlocked => this.changeUnlockState(isUnlocked));
    this.getSelectedAddress().subscribe(address => this.changeAddressState(address));
    this.getIdentities().subscribe(identities => this.changeIdentities(identities));
  }

  changeExistsVaultState(existsVault: boolean): void {
    this.existsVaultSubject.next(existsVault);
  }

  changeUnlockState(isUnlocked: boolean): void {
    this.unlockSubject.next(isUnlocked);
  }

  changeAddressState(address: string): void {
    this.selectedAddressSubject.next(address);
  }

  changeIdentities(identities: {address: string, name: string, isImport: boolean}[]) {
    this.identitiesSubject.next(identities);
  }

  closeWindow(): void {
    chrome.tabs.getCurrent(tab => {
      if (tab) {
        chrome.tabs.remove(tab.id);
      } else {
        window.close();
      }
    });
  }

  generateRandomMnemonic(): Observable<string> {
    return this.getBackground()
      .pipe(map(bg => bg.keyring.generateRandomMnemonic()));
  }

  // generateRandomBip39Mnemonic(): Observable<string> {
  //   return this.getBackground()
  //     .pipe(map(bg => bg.bitcore.generateRandomBip39Mnemonic()));
  // }

  decodeBase58(str: string): Observable<Uint8Array> {
    return this.getBackground()
      .pipe(map(bg => bg.keyring.decodeBase58(str)));
  }

  interpretError(error: any): string {
    let errorMessage = '';

    if (this.isObject(error) && 'error' in error) {
      if (this.isObject(error.error) && 'data' in error.error) {
        if (this.isObject(error.error.data) && 'message' in error.error.data) {
          try {
            errorMessage = JSON.parse(error.error.data.message).message;
          } catch (e) {
            errorMessage = error.error.data.message;
          }

          if (/("message"\:")(.+)("\},)/.test(errorMessage)) {
            errorMessage = /("message"\:")(.+)("\},)/.exec(errorMessage)[2];
          } else if (/(result is None)(.+)(monacoin)/.test(errorMessage)) {
            errorMessage = 'Monacoin API is dead.';
          } else if (/(result is None)(.+)(counterparty)/.test(errorMessage)) {
            errorMessage = 'Counterparty API is dead.';
          }
        } else if (this.isObject(error.error.data)) {
          errorMessage = JSON.stringify(error.error.data);
        } else {
          errorMessage = error.error.data;
        }
      } else if (this.isObject(error.error)) {
        errorMessage = JSON.stringify(error.error);
      } else {
        if (/(ECONNREFUSED)/.test(error.error)) {
          errorMessage = 'Counterblock API is dead.';
        } else if (/(Server is not caught up)/.test(error.error)) {
          errorMessage = 'Server is not caught up.';
        } else {
          errorMessage = error.error;
        }
      }
    } else if (this.isObject(error)) {
      errorMessage = JSON.stringify(error);
    } else {
      errorMessage = error;
    }

    return errorMessage;
  }

  private isObject(obj: any): boolean {
    return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase() === 'object';
  }
}
