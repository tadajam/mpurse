import { Injectable } from '@angular/core';
import { Subject, Observable, from } from 'rxjs';
import { map, flatMap, first, tap } from 'rxjs/operators';
import * as jazzicon from 'jazzicon';
import { TranslateService } from '@ngx-translate/core';
import { ExtensionMessage } from 'extension_scripts/enum/extensionMessage';
import { Hdkey } from 'extension_scripts/keyring';

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

  private identitiesSubject = new Subject<
    { address: string; name: string; isImport: boolean }[]
  >();
  identitiesState = this.identitiesSubject.asObservable();

  constructor(private translate: TranslateService) {}

  private sendMessage<T = void>(
    type: ExtensionMessage,
    payload?: any
  ): Observable<T> {
    return new Observable<T>(observer => {
      chrome.runtime.sendMessage({ type, ...payload }, response => {
        if (chrome.runtime.lastError) {
          observer.error(chrome.runtime.lastError.message);
        } else if (response && typeof response === 'object') {
          if (response.success === false) {
            try {
              const e = JSON.parse(response.error);
              observer.error(e);
            } catch {
              observer.error(response.error || 'Unknown error');
            }
          } else if (response.success === true) {
            if ('body' in response) {
              observer.next(response.body as T);
            } else {
              observer.next();
            }
            observer.complete();
          } else {
            observer.error('Unexpected response format');
          }
        } else {
          observer.error('Invalid response format');
        }
      });
    });
  }

  private sendMessageWithStateUpdate<T = void>(
    type: ExtensionMessage,
    payload?: any
  ): Observable<T> {
    return this.sendMessage<T>(type, payload).pipe(
      tap(() => this.updateState())
    );
  }

  isUnlocked(): Observable<boolean> {
    return this.sendMessage<boolean>(ExtensionMessage.IsUnlocked);
  }

  register(password: string): Observable<void> {
    return this.sendMessage<void>(ExtensionMessage.Unlock, { password });
  }

  unlock(password: string): Observable<void> {
    return this.sendMessageWithStateUpdate<void>(ExtensionMessage.Unlock, {
      password
    });
  }

  lock(): Observable<void> {
    return this.sendMessageWithStateUpdate<void>(ExtensionMessage.Lock);
  }

  getSelectedAddress(): Observable<string> {
    return this.sendMessage<string>(ExtensionMessage.GetSelectedAddress);
  }

  setAccountName(address: string, name: string): Observable<void> {
    return this.sendMessage<void>(ExtensionMessage.SetAccountName, {
      address,
      name
    });
  }

  getIdentities(): Observable<
    { address: string; name: string; isImport: boolean }[]
  > {
    return this.sendMessage<
      { address: string; name: string; isImport: boolean }[]
    >(ExtensionMessage.GetIdentities);
  }

  changeAddress(address: string): Observable<void> {
    return this.sendMessageWithStateUpdate<void>(
      ExtensionMessage.ChangeAddress,
      {
        address
      }
    );
  }

  saveNewPassphrase(
    passphrase: string,
    seedVersion: string,
    basePath: string,
    baseName: string
  ): Observable<void> {
    return this.sendMessageWithStateUpdate<void>(
      ExtensionMessage.SaveNewPassphrase,
      {
        passphrase,
        seedVersion,
        basePath,
        baseName
      }
    );
  }

  getPassphrase(password: string): Observable<string> {
    return this.sendMessage<string>(ExtensionMessage.GetPassphrase, {
      password
    });
  }

  getHdkey(password: string): Observable<Hdkey> {
    return this.sendMessage<Hdkey>(ExtensionMessage.GetHdkey, { password });
  }

  createAccount(name: string): Observable<void> {
    return this.sendMessage<void>(ExtensionMessage.CreateAccount, {
      name
    }).pipe(tap(() => this.updateState()));
  }

  importAccount(privatekey: string, name: string): Observable<void> {
    return this.sendMessageWithStateUpdate<void>(
      ExtensionMessage.ImportAccount,
      {
        privatekey,
        name
      }
    );
  }

  getPrivatekey(password: string, address: string): Observable<string> {
    return this.sendMessage<string>(ExtensionMessage.GetPrivatekey, {
      password,
      address
    });
  }

  getPendingRequest(id?: number): Observable<any | null> {
    return this.sendMessage<any | null>(ExtensionMessage.GetPendingRequest, {
      id
    });
  }

  shiftRequest(
    isSuccessful: boolean,
    id: number,
    result: any
  ): Observable<void> {
    return this.sendMessage<void>(ExtensionMessage.ShiftRequest, {
      isSuccessful,
      id,
      result
    });
  }

  signRawTransaction(tx: string): Observable<string> {
    return this.sendMessage<string>(ExtensionMessage.SignRawTransaction, {
      tx
    });
  }

  signMessage(message: string): Observable<string> {
    return this.sendMessage<string>(ExtensionMessage.SignMessage, { message });
  }

  sendRawTransaction(tx: string): Observable<any> {
    return this.sendMessage<any>(ExtensionMessage.SendRawTransaction, { tx });
  }

  approveOrigin(origin: string, id: number): Observable<boolean> {
    return this.sendMessage<boolean>(ExtensionMessage.ApproveOrigin, {
      origin,
      id
    });
  }

  removeAccount(address: string): Observable<void> {
    return this.sendMessageWithStateUpdate<void>(
      ExtensionMessage.RemoveAccount,
      {
        address
      }
    );
  }

  incrementAccountName(name: string, num: number): Observable<string> {
    return this.sendMessage<string>(ExtensionMessage.IncrementAccountName, {
      name,
      num
    });
  }

  isAdvancedModeEnabled(): Observable<boolean> {
    return this.sendMessage<boolean>(ExtensionMessage.IsAdvancedModeEnabled);
  }

  setAdvancedMode(isEnabled: boolean): Observable<void> {
    return this.sendMessage<void>(ExtensionMessage.SetAdvancedMode, {
      isEnabled
    });
  }

  getLang(): Observable<string> {
    return this.sendMessage<string>(ExtensionMessage.GetLang).pipe(
      map(lang => {
        let language = lang || this.translate.getBrowserLang();
        language = /(en|ja)/gi.test(language) ? language : 'en';
        return language;
      })
    );
  }

  setLang(lang: string): Observable<void> {
    return this.sendMessage<void>(ExtensionMessage.SetLang, { lang });
  }

  purgeAll(): Observable<void> {
    return this.sendMessageWithStateUpdate<void>(ExtensionMessage.PurgeAll);
  }

  existsVault(): Observable<boolean> {
    return this.sendMessage<boolean>(ExtensionMessage.ExistsVault);
  }

  getAddressInfo(address: string): Observable<any> {
    return this.sendMessage<any>(ExtensionMessage.GetAddressInfo, { address });
  }

  getAsset(asset: string): Observable<any> {
    return this.sendMessage<any>(ExtensionMessage.GetAsset, { asset });
  }

  getAccountSummary(address: string): Observable<any> {
    return this.sendMessage<any>(ExtensionMessage.GetAccountSummary, {
      address
    });
  }

  viewNewTab(url: string): void {
    chrome.tabs.create({ url });
  }

  getBalances(address: string, page: number, limit: number): Observable<any> {
    return this.sendMessage<any>(ExtensionMessage.GetBalances, {
      address,
      page,
      limit
    });
  }

  createSend(
    source: string,
    destination: string,
    asset: string,
    quantity: number,
    memo: string,
    memoIsHex: boolean,
    feePerKb: number,
    disableUtxoLocks: boolean
  ): Observable<any> {
    return this.sendMessage<any>(ExtensionMessage.CreateSend, {
      source,
      destination,
      asset,
      quantity,
      memo,
      memoIsHex,
      feePerKb,
      disableUtxoLocks
    });
  }

  send(tx: string): Observable<any> {
    return this.sendMessage<any>(ExtensionMessage.Send, { tx });
  }

  updateState(): void {
    this.existsVault().subscribe(existsVault =>
      this.changeExistsVaultState(existsVault)
    );
    this.isUnlocked().subscribe(isUnlocked =>
      this.changeUnlockState(isUnlocked)
    );
    this.getSelectedAddress().subscribe(address =>
      this.changeAddressState(address)
    );
    this.getIdentities().subscribe(identities =>
      this.changeIdentities(identities)
    );
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

  changeIdentities(
    identities: { address: string; name: string; isImport: boolean }[]
  ): void {
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

  generateRandomMnemonic(
    seedVersion: string,
    seedLanguage: string
  ): Observable<string> {
    return this.sendMessage<string>(ExtensionMessage.GenerateRandomMnemonic, {
      seedVersion,
      seedLanguage
    });
  }

  decodeBase58(str: string): Observable<Uint8Array> {
    return this.sendMessage<Uint8Array>(ExtensionMessage.DecodeBase58, { str });
  }

  getIdentIcon(address: string): Observable<string> {
    return this.decodeBase58(address).pipe(
      map(bytes => {
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
    return (
      Object.prototype.toString
        .call(obj)
        .slice(8, -1)
        .toLowerCase() === 'object'
    );
  }
}
