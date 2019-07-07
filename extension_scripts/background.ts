import { ContentScriptMessage } from './enum/contentScriptMessage';

import { EncryptUtil } from './util.encrypt';
import { MpchainUtil } from './util.mpchain';
import { Keyring } from './keyring';

declare global {
  interface Window { bg: Background; }
}

interface VaultData {
  hdkey: {
    hdPath: string,
    mnemonic: string,
    numberOfAccounts: number
  };
  privatekeys: string[];
}

interface StoredData {
  version: number;
  preferences: Preferences;
  vault: {
    data: string;
    checksum: string;
  };
}

interface Preferences {
  identities: {
    address: string,
    name: string,
    isImport: boolean
  }[];
  selectedAddress: string;
  isAdvancedModeEnabled: boolean;
}

interface Request {
  target: string;
  port: chrome.runtime.Port;
  type: ContentScriptMessage;
  id: number;
  origin: string;
  data: any;
}

enum Platform {
  PLATFORM_CHROME,
  PLATFORM_FIREFOX,
  PLATFORM_EDGE,
  PLATFORM_OPERA,
  PLATFORM_FIREFOX_ANDROID
}

class Background {

  private version = 2;
  private isUnlocked = false;
  private password: string;
  private preferences: Preferences;
  private keyring: Keyring;

  private requests: Request[] = [];

  private connectedPorts: {
    port: chrome.runtime.Port,
    origin: string
  }[] = [];
  private approvedOrigins: string[] = [];

  constructor() {
    this.resetPreferences();
    this.resetKeyring();

    this.assignEventHandlers();
  }

  assignEventHandlers(): void {
    chrome.runtime.onConnect.addListener((port: chrome.runtime.Port) => {
      if (port.name === ContentScriptMessage.PortName) {
        port.onMessage.addListener((message: any, connectedPort: chrome.runtime.Port) => {
          switch (message.type) {
            case ContentScriptMessage.InPageContent:
              this.readAsTextInpage()
                .then(script => {
                  connectedPort.postMessage({
                    type: message.type,
                    script: script
                  });
                });
              break;

            case ContentScriptMessage.InPageInit:
              connectedPort.onDisconnect.addListener((initPort: chrome.runtime.Port) => {
                this.connectedPorts = this.connectedPorts.filter(cp => cp.port.sender.id !== initPort.sender.id);
                this.requests = this.requests.filter(r => r.port.sender.id !== initPort.sender.id);

                this.setBadgeText(false);
              });
              this.connectedPorts.push({port: connectedPort, origin: message.origin});

              this.executeRequest(connectedPort, message);
              break;

            case ContentScriptMessage.Address:
              if (this.isApprovedOrigin(message.origin)) {
                this.executeRequest(connectedPort, message);
              } else {
                this.setRequest('', connectedPort, message);
              }
              break;

            case ContentScriptMessage.SendAsset:
              this.setRequest('send', connectedPort, message);
              break;

            case ContentScriptMessage.SignRawTransaction:
              this.setRequest('transaction', connectedPort, message);
              break;

            case ContentScriptMessage.SignMessage:
              this.setRequest('signature', connectedPort, message);
              break;

            case ContentScriptMessage.SendRawTransaction:
              this.setRequest('transaction', connectedPort, message);
              break;

            case ContentScriptMessage.Mpchain:
              this.executeRequest(connectedPort, message);
              break;

            case ContentScriptMessage.CounterBlock:
              this.executeRequest(connectedPort, message);
              break;

            case ContentScriptMessage.CounterParty:
              this.executeRequest(connectedPort, message);
              break;
          }
        });
      }
    });

    if (this.getPlatform() === Platform.PLATFORM_CHROME || this.getPlatform() === Platform.PLATFORM_OPERA) {
      chrome.runtime.onSuspend.addListener(() => {
        this.setBadgeText(true);
      });
    }
  }

  setBadgeText(shouldDelete: boolean): void {
    if (this.getPlatform() !== Platform.PLATFORM_FIREFOX_ANDROID) {
      chrome.browserAction.setBadgeText({text: shouldDelete || this.requests.length === 0 ? '' : this.requests.length.toString()});
    }
  }

  async readAsTextInpage(): Promise<string> {
    const inpage = await fetch(chrome.runtime.getURL('extension_scripts/inpage.js'), { method: 'GET' });
    return await inpage.text();
  }

  private getPlatform(): Platform {
    const ua = navigator.userAgent;
    if (ua.search('Firefox') !== -1) {
      if (ua.search('Android') !== -1) {
        return Platform.PLATFORM_FIREFOX_ANDROID;
      } else {
        return Platform.PLATFORM_FIREFOX;
      }
    } else {
      // if (window && window.chrome && window.chrome.ipcRenderer) {
      //   return Platform.PLATFORM_BRAVE;
      // } else
      if (ua.search('Edge') !== -1) {
        return Platform.PLATFORM_EDGE;
      } else if (ua.search('OPR') !== -1) {
        return Platform.PLATFORM_OPERA;
      } else {
      return Platform.PLATFORM_CHROME;
      }
    }
  }

  async send(tx: string): Promise<any> {
    if (! this.isUnlocked) {
      this.resetPreferences();
      this.resetKeyring();
      Promise.reject('Not logged in');
    } else {
      const hex = await this.keyring.signTransaction(tx, this.preferences.selectedAddress);
      return MpchainUtil.sendTx(hex);
    }
  }

  signRawTransaction(tx: string): Promise<string> {
    return this.keyring.signTransaction(tx, this.preferences.selectedAddress);
  }

  signMessage(message: string): string {
    return this.keyring.signMessage(message, this.preferences.selectedAddress);
  }

  async sendRawTransaction(tx: string): Promise<any> {
    const hex = await this.keyring.signTransaction(tx, this.preferences.selectedAddress);
    return MpchainUtil.sendTx(hex);
  }

  private popup(): void {
    if (this.getPlatform() === Platform.PLATFORM_FIREFOX_ANDROID) {
      chrome.tabs.create({url: 'index.html'});
    } else {
      chrome.windows.create({
        url: 'index.html',
        type: 'popup',
        width: 375,
        height: 636
      });
    }
  }

  private setRequest(target: string, port: chrome.runtime.Port, message: any): void {
    this.requests.unshift({
      target: target,
      port: port,
      type: message.type,
      id: message.id,
      origin: message.origin,
      data: message.data
    });

    this.setBadgeText(false);
    this.popup();
  }

  private executeRequest(connectedPort: chrome.runtime.Port, message: any): void {
    let response = {};
    switch (message.type) {
      case ContentScriptMessage.InPageInit:
        response = {isUnlocked: this.isUnlocked};
        connectedPort.postMessage({type: message.type, id: message.id, data: response});
        break;
      case ContentScriptMessage.Address:
        response = {address: this.preferences.selectedAddress};
        connectedPort.postMessage({type: message.type, id: message.id, data: response});
        break;
      case ContentScriptMessage.Mpchain:
        MpchainUtil.mp(message.data.method, message.data.params)
          .then(result => {
            connectedPort.postMessage({type: message.type, id: message.id, data: result});
          })
          .catch(error => {
            connectedPort.postMessage({type: message.type, id: message.id, data: error});
          });
        break;
      case ContentScriptMessage.CounterBlock:
        MpchainUtil.cb(message.data.method, message.data.params)
          .then(result => {
            connectedPort.postMessage({type: message.type, id: message.id, data: result});
          })
          .catch(error => {
            connectedPort.postMessage({type: message.type, id: message.id, data: error});
          });
        break;
      case ContentScriptMessage.CounterParty:
        MpchainUtil.cp(message.data.method, message.data.params)
          .then(result => {
            connectedPort.postMessage({type: message.type, id: message.id, data: result});
          })
          .catch(error => {
            connectedPort.postMessage({type: message.type, id: message.id, data: error});
          });
        break;
    }
  }

  executePendingRequests(): void {
    const rb = this.requests.concat();
    for (let i = 0; i < rb.length; i++) {
      if (rb[i].target === '' && this.isApprovedOrigin(rb[i].origin)) {
        this.executeRequest(rb[i].port, rb[i]);
        this.requests = this.requests.filter(r => r.id.toString() !== rb[i].id.toString());

        this.setBadgeText(false);
      }
    }
  }

  getPendingRequest(id?: number): any | null {
    if (this.requests.length === 0 || (id !== undefined && ! this.requests.some(r => r.id.toString() === id.toString()))) {
      return null;
    } else {
      const targetRequest = id !== undefined ? this.requests.find(r => r.id.toString() === id.toString()) : this.requests[0];
      if (this.isApprovedOrigin(targetRequest.origin)) {
        return targetRequest;
      } else {
        return {
          target: 'approve',
          port: null,
          type: null,
          id: targetRequest.id,
          origin: targetRequest.origin,
          data: null
        };
      }
    }
  }

  shiftRequest(isSuccessful: boolean, id: number, result: any): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.requests.length !== 0 && this.requests.some(r => r.id.toString() === id.toString())) {
        this.sendResponse(isSuccessful, id, result);
        resolve();
      } else {
        if (isSuccessful) {
          reject('Request Not Found');
        } else {
          resolve();
        }
      }
    });
  }

  sendResponse(isSuccessful: boolean, id: number, result: Object) {
    let data: Object = null;
    if (isSuccessful || 'error' in result) {
      data = result;
    } else {
      data = {error: 'Unknown Error'};
    }

    const targetIndex = this.requests.findIndex(r => r.id.toString() === id.toString());
    if (targetIndex !== -1) {
      this.requests[targetIndex].port.postMessage({
        type: this.requests[targetIndex].type,
        id: id,
        data: data
      });

      this.requests = this.requests.filter(r => r.id.toString() !== id.toString());

      this.setBadgeText(false);
    }
  }

  approveOrigin(origin: string, id: number): boolean {
    if (! this.isApprovedOrigin(origin)) {
      this.approvedOrigins.push(origin);
      this.executePendingRequests();
    }
    const targetIndex = this.requests.findIndex(r => r.id.toString() === id.toString());
    return targetIndex !== -1;
  }

  isApprovedOrigin(origin: string): boolean {
    return this.approvedOrigins.some(approved => approved === origin);
  }

  private broadcastUpdate(type: ContentScriptMessage, data: any): void {
    for (let i = 0; i < this.connectedPorts.length; i++) {
      if (type === ContentScriptMessage.LoginState || this.isApprovedOrigin(this.connectedPorts[i].origin)) {
        this.connectedPorts[i].port.postMessage({
          type: type,
          id: 0,
          data: data
        });
      }
    }
  }

  private resetPassword(): void {
    this.isUnlocked = false;
    this.password = '';
    this.broadcastUpdate(ContentScriptMessage.LoginState, {isUnlocked: this.isUnlocked});
  }

  private resetKeyring(): void {
    this.keyring = new Keyring();
  }

  private resetPreferences(): void {
    this.preferences = {
      identities: [],
      selectedAddress: '',
      isAdvancedModeEnabled: false
    };
    this.broadcastUpdate(ContentScriptMessage.AddressState, {address: ''});
  }

  private resetRequest() {
    const r = this.requests.concat();
    for (let i = 0; i < r.length; i++) {
      this.sendResponse(false, r[i].id, {error: 'User Cancelled'});
    }
  }

  private resetApprovedOrigins() {
    this.approvedOrigins = [];
  }

  unlock(pw: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      chrome.storage.local.get(['vault', 'preferences', 'version'], items => {
        if ('vault' in items && 'data' in items.vault && 'checksum' in items.vault) {
          if (items.vault.checksum === EncryptUtil.createCheckSum(pw)) {
            this.password = pw;
            this.isUnlocked = true;

            // version 1 > version 2
            if (items.version === 1) {
              if (! items.preferences.hasOwnProperty('isAdvancedModeEnabled')) {
                items.preferences.isAdvancedModeEnabled = false;
              }
            }

            this.preferences = items.preferences;
            this.deserializeKeyring(items.vault.data);
            resolve();
          } else {
            this.resetPassword();
            reject('Unlock Failed');
          }
        } else {
          this.password = pw;
          resolve();
        }
      });
    });
  }

  lock(): void {
    this.resetPreferences();
    this.resetKeyring();
    this.resetPassword();
    this.resetRequest();
    this.resetApprovedOrigins();
  }

  getIsUnlocked(): boolean {
    return this.isUnlocked;
  }

  isAdvancedModeEnabled(): boolean {
    return this.preferences.isAdvancedModeEnabled;
  }

  setAdvancedMode(isEnabled: boolean): Promise<void> {
    this.preferences.isAdvancedModeEnabled = isEnabled;
    return this.updateState();
  }

  createKeyring(passphrase: string, numberOfAccounts: number, privatekeys: string[]): void {
    this.keyring = new Keyring();
    this.keyring.deserialize(passphrase, numberOfAccounts, privatekeys);

    const accounts = this.keyring.getAccounts();
    for (let i = 0; i < accounts.length; i++) {
      const accountName = this.incrementAccountName('Account ', this.preferences.identities.length + 1);
      this.setIdentities(accounts[i].address, accountName, accounts[i].index < 0);
    }
    if (this.preferences.selectedAddress === '') {
      this.changeAddress(accounts[0].address);
    }

    this.broadcastUpdate(ContentScriptMessage.LoginState, {isUnlocked: this.isUnlocked});
  }

  setIdentities(address: string, name: string, isImport: boolean) {
    if (! this.preferences.identities.some(value => value.address === address)) {
      this.preferences.identities.push({
        address: address,
        name: name,
        isImport: isImport
      });
    }
  }

  deserializeKeyring(data: string): void {
    const key = JSON.parse(EncryptUtil.decrypt(data, this.password));
    this.createKeyring(key.hdkey.mnemonic, key.hdkey.numberOfAccounts, key.privatekeys);
  }

  private saveState(data: VaultData): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (! this.isUnlocked) {
        this.resetPreferences();
        this.resetKeyring();
        reject('Not Logged In.');
      } else {
        const storedData: StoredData = {
          version: this.version,
          preferences: this.preferences,
          vault: {
            data: EncryptUtil.encrypt(JSON.stringify(data), this.password),
            checksum: EncryptUtil.createCheckSum(this.password)
          }
        };
        chrome.storage.local.set(storedData, () => {
          resolve();
        });
      }
    });
  }

  updateState(): Promise<void> {
    return this.saveState(this.keyring.serialize());
  }

  saveNewPassphrase(passphrase: string): Promise<void> {
    if (this.password !== '') {
      this.isUnlocked = true;
    }
    this.createKeyring(passphrase, 1, []);

    return this.updateState();
  }

  getPassphrase(password: string): string {
    let passphrase = '';
    if (password === this.password) {
      passphrase = this.keyring.getPassphrase();
    }
    return passphrase;
  }

  getPrivatekey(password: string, address: string): string {
    let privatekey = '';
    if (password === this.password) {
      privatekey = this.keyring.getPrivatekey(address);
    }
    return privatekey;
  }

  createAccount(name: string): Promise<void> {
    if (name === '') {
      return Promise.reject('The account name is empty');
    } else if (this.preferences.identities.some(value => value.name === name)) {
      return Promise.reject('The account name is a duplicate');
    } else {
      const account = this.keyring.addAccount();
      this.setIdentities(account.address, name, account.index < 0);
      this.changeAddress(account.address);
      return this.updateState();
    }
  }

  importAccount(wif: string, name: string): Promise<void> {
    if (name === '') {
      return Promise.reject('The account name is empty');
    } else if (this.preferences.identities.some(value => value.name === name)) {
      return Promise.reject('The account name is a duplicate');
    } else if (this.keyring.containsPrivatekey(wif)) {
      return Promise.reject('The account you are trying to import is a duplicate');
    } else {
      const account = this.keyring.importAccount(wif);
      this.setIdentities(account.address, name, account.index < 0);
      this.changeAddress(account.address);
      return this.updateState();
    }
  }

  removeAccount(address: string): Promise<void> {
    this.keyring.removeAccount(address);
    this.preferences.identities = this.preferences.identities.filter(value => value.address !== address);
    if (this.preferences.selectedAddress === address) {
      this.changeAddress(this.keyring.getAccounts()[0].address);
    }
    return this.updateState();
  }

  incrementAccountName(name: string, num: number) {
    while (this.preferences.identities.some(value => value.name === (name + num))) {
      num++;
    }

    return name + num;
  }

  purgeAll(): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.clear(() => {
        this.lock();
        resolve();
      });
    });
  }

  existsVault(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      chrome.storage.local.get('vault', items => {
        if ('vault' in items && 'data' in items.vault && 'checksum' in items.vault) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }

  getAddressInfo(address: string): Promise<any> {
    return MpchainUtil.getAddressInfo(address);
  }

  getAsset(asset: string): Promise<any> {
    return MpchainUtil.getAsset(asset);
  }

  getBalances(address: string, page: number, limit: number): Promise<any> {
    return MpchainUtil.getBalances(address, page, limit);
  }

  getMempool(address: string, page: number, limit: number): Promise<any> {
    return MpchainUtil.getMempool(address, page, limit);
  }

  getIdentities(): {address: string, name: string, isImport: boolean}[] {
    return this.preferences.identities;
  }

  setAccountName(address: string, name: string): Promise<void> {
    const identity = this.preferences.identities.find(value => value.address === address);
    if (! identity) {
      return Promise.reject('Account Not Found');
    } else if (name === '') {
      return Promise.reject('The account name is empty');
    } else if (this.preferences.identities.some(value => value.name === name)) {
      return Promise.reject('The account name is a duplicate');
    } else {
      identity.name = name;
      return this.updateState();
    }
  }

  getIdentity(address: string): {address: string, name: string, isImport: boolean}  {
    return this.preferences.identities.find(value => value.address === address);
  }

  getSelectedAddress(): string {
    return this.preferences.selectedAddress;
  }

  private changeAddress(address: string): void {
    if (this.preferences.selectedAddress !== address) {
      const r = this.requests.concat();
      for (let i = 0; i < r.length; i++) {
        this.sendResponse(false, r[i].id, {error: 'User Cancelled'});
      }
      this.preferences.selectedAddress = address;
      this.broadcastUpdate(ContentScriptMessage.AddressState, {address: address});
    }
  }

  setSelectedAddress(address: string): Promise<void> {
    this.changeAddress(address);
    return this.updateState();
  }

  createSend(source: string, destination: string, asset: string,
    quantity: number, memo: string, memo_is_hex: boolean, fee_per_kb: number, disableUtxoLocks: boolean): Promise<any> {
    return MpchainUtil.createSend(source, destination, asset, quantity, memo, memo_is_hex, fee_per_kb, disableUtxoLocks);
  }
}

window.bg = new Background();
