declare global {
  interface Window {
    mpurse: Mpurse;
  }
}

import { InPageMessage } from './enum/inPageMessage';
import { EventEmitter } from 'events';

class Mpurse {

  private addressListener;

  updateEmitter: EventEmitter;

  constructor() {
    this.addressListener =
      this.createListener(InPageMessage.AddressState, false, 0, m => this.updateEmitter.emit('addressChanged', m.data.address));

    this.updateEmitter = new EventEmitter();
    this.init();
  }

  private onMessage(messageType: string, remove: boolean, id: number, handler: any): void {
    const listener = this.createListener(messageType, remove, id, handler);
    window.addEventListener('message', listener);
  }

  private createListener(messageType: string, remove: boolean, id: number, handler: any): any {
    const listener = (event: MessageEvent) => {
      if (event.data.action === messageType && event.data.id === id) {
        if (remove) {
          window.removeEventListener('message', listener);
        }
        handler(event.data);
      }
    };
    return listener;
  }

  private init(): void {
    const id = Math.random();
    this.onMessage(InPageMessage.InitResponse, true, id, message => {
      this.onMessage(InPageMessage.LoginState, false, 0, m => this.updateEmitter.emit('stateChanged', m.data.isUnlocked));
      this.updateEmitter.emit('stateChanged', message.data.isUnlocked);
    });
    window.postMessage({action: InPageMessage.InitRequest, id: id, message: null}, '*');
  }

  // Mpurse

  getAddress(): Promise<string> {
    return new Promise((resolve, reject) => {
      const id = Math.random();
      this.onMessage(InPageMessage.AddressResponse, true, id, message => {
        if (message.data.error) {
          reject(message.data.error);
        } else {
          window.removeEventListener('message', this.addressListener);
          window.addEventListener('message', this.addressListener);
          this.updateEmitter.emit('addressChanged', message.data.address);
          resolve(message.data.address);
         }
      });
      window.postMessage({action: InPageMessage.AddressRequest, id: id, message: null}, '*');
    });
  }

  sendAsset(to: string, asset: string, amount: number, memoType: string, memoValue: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const id = Math.random();
      this.onMessage(InPageMessage.SendAssetResponse, true, id, message => {
        message.data.error ? reject(message.data.error) : resolve(message.data.txHash);
      });
      const requestParam = {
        to: to,
        asset: asset,
        amount: amount,
        memoType: memoType,
        memoValue: memoValue
      };
      window.postMessage({action: InPageMessage.SendAssetRequest, id: id, message: requestParam}, '*');
    });
  }

  signRawTransaction(tx: string): Promise<string>  {
    return new Promise((resolve, reject) => {
      const id = Math.random();
      this.onMessage(InPageMessage.SignRawTransactionResponse, true, id, message => {
        message.data.error ? reject(message.data.error) : resolve(message.data.signedTx);
      });
      const requestParam = {
        tx: tx
      };
      window.postMessage({action: InPageMessage.SignRawTransactionRequest, id: id, message: requestParam}, '*');
    });
  }

  signMessage(personalMessage: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const id = Math.random();
      this.onMessage(InPageMessage.SignMessageResponse, true, id, message => {
        message.data.error ? reject(message.data.error) : resolve(message.data.signature);
      });
      const requestParam = {
        message: personalMessage
      };
      window.postMessage({action: InPageMessage.SignMessageRequest, id: id, message: requestParam}, '*');
    });
  }

  sendRawTransaction(tx: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const id = Math.random();
      this.onMessage(InPageMessage.SendRawTransactionResponse, true, id, message => {
        message.data.error ? reject(message.data.error) : resolve(message.data.txHash);
      });
      const requestParam = {
        tx: tx
      };
      window.postMessage({action: InPageMessage.SendRawTransactionRequest, id: id, message: requestParam}, '*');
    });
  }

  // Mpchain

  mpchain(method: string, params: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = Math.random();
      this.onMessage(InPageMessage.MpchainResponse, true, id, message => {
        message.data.error ? reject(message.data.error) : resolve(message.data);
      });
      const requestParam = {
        method: method,
        params: params
      };
      window.postMessage({action: InPageMessage.MpchainRequest, id: id, message: requestParam}, '*');
    });
  }

  // Counterblock

  counterBlock(method: string, params: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = Math.random();
      this.onMessage(InPageMessage.CounterBlockResponse, true, id, message => {
        message.data.error ? reject(message.data.error) : resolve(message.data);
      });
      const requestParam = {
        method: method,
        params: params
      };
      window.postMessage({action: InPageMessage.CounterBlockRequest, id: id, message: requestParam}, '*');
    });
  }

  counterParty(method: string, params: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = Math.random();
      this.onMessage(InPageMessage.CounterPartyResponse, true, id, message => {
        message.data.error ? reject(message.data.error) : resolve(message.data);
      });
      const requestParam = {
        method: method,
        params: params
      };
      window.postMessage({action: InPageMessage.CounterPartyRequest, id: id, message: requestParam}, '*');
    });
  }
}

window.mpurse = new Mpurse();
