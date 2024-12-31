import { ContentScriptMessage } from './enum/contentScriptMessage';
import { InPageMessage } from './enum/inPageMessage';
import { BitcoreUtil } from './util.bitcore';

class ContentScript {
  private isAlive = false;
  private port: chrome.runtime.Port;

  constructor() {
    this.assignEventHandlers();
    this.connectPort();
  }

  connectPort(): void {
    this.port = chrome.runtime.connect({ name: ContentScriptMessage.PortName });
    this.isAlive = true;

    this.port.onMessage.addListener((message: any) => {
      if (message && message.type) {
        window.postMessage(
          {
            action: this.getResponseAction(message.type),
            id: message.id,
            data: message.data
          },
          '*'
        );
      }
    });

    this.port.onDisconnect.addListener(() => {
      this.isAlive = false;
      window.postMessage(
        {
          action: InPageMessage.LoginState,
          id: 0,
          data: { isUnlocked: false }
        },
        '*'
      );
      window.postMessage(
        {
          action: InPageMessage.AddressState,
          id: 0,
          data: { address: '' }
        },
        '*'
      );
    });
  }

  assignEventHandlers(): void {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case ContentScriptMessage.GenerateRandomMnemonic:
          sendResponse(
            this.generateRandomMnemonic(
              message.seedVersion,
              message.seedLanguage
            )
          );
          break;
        case ContentScriptMessage.SignMessage:
          sendResponse(this.signMessage(message.message, message.hex));
          break;
      }
      return true;
    });

    window.addEventListener('message', async (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.data.action) {
        if (!this.isAlive) {
          this.connectPort();
        }

        try {
          this.port.postMessage({
            type: this.getRequestType(event.data.action),
            id: event.data.id,
            origin: event.origin,
            data: event.data.message
          });
        } catch (e) {
          window.postMessage(
            {
              action: this.getResponseAction(
                this.getRequestType(event.data.action)
              ),
              id: event.data.id,
              data: { error: 'Extension context invalidated' }
            },
            '*'
          );
        }
      }
    });
    document.addEventListener('DOMContentLoaded', () => {
      const head = document.head || document.documentElement;
      if (head) {
        this.injectScript();
      }
    });
  }

  injectScript(): void {
    try {
      const scriptTag = document.createElement('script');
      scriptTag.src = chrome.runtime.getURL('extension_scripts/inpage.js');
      scriptTag.async = false;
      document.head.appendChild(scriptTag);
      document.head.removeChild(scriptTag);
    } catch (e) {
      console.error('Script injection failed', e);
    }
  }

  generateRandomMnemonic(seedVersion: string, seedLanguage: string): string {
    return BitcoreUtil.generateRandomMnemonic(seedVersion, seedLanguage);
  }

  signMessage(message: string, hex: string): string {
    return BitcoreUtil.signMessage(message, hex);
  }

  getRequestType(action: InPageMessage): ContentScriptMessage {
    switch (action) {
      case InPageMessage.InitRequest:
        return ContentScriptMessage.InPageInit;

      case InPageMessage.AddressRequest:
        return ContentScriptMessage.Address;

      case InPageMessage.SendAssetRequest:
        return ContentScriptMessage.SendAsset;

      case InPageMessage.SignRawTransactionRequest:
        return ContentScriptMessage.SignRawTransaction;

      case InPageMessage.SignMessageRequest:
        return ContentScriptMessage.SignMessage;

      case InPageMessage.SendRawTransactionRequest:
        return ContentScriptMessage.SendRawTransaction;

      case InPageMessage.MpchainRequest:
        return ContentScriptMessage.Mpchain;

      case InPageMessage.CounterBlockRequest:
        return ContentScriptMessage.CounterBlock;

      case InPageMessage.CounterPartyRequest:
        return ContentScriptMessage.CounterParty;
    }
  }

  getResponseAction(type: ContentScriptMessage): InPageMessage {
    switch (type) {
      case ContentScriptMessage.InPageContent:
        return null;

      case ContentScriptMessage.InPageInit:
        return InPageMessage.InitResponse;

      case ContentScriptMessage.LoginState:
        return InPageMessage.LoginState;

      case ContentScriptMessage.AddressState:
        return InPageMessage.AddressState;

      case ContentScriptMessage.Address:
        return InPageMessage.AddressResponse;

      case ContentScriptMessage.SendAsset:
        return InPageMessage.SendAssetResponse;

      case ContentScriptMessage.SignRawTransaction:
        return InPageMessage.SignRawTransactionResponse;

      case ContentScriptMessage.SignMessage:
        return InPageMessage.SignMessageResponse;

      case ContentScriptMessage.SendRawTransaction:
        return InPageMessage.SendRawTransactionResponse;

      case ContentScriptMessage.Mpchain:
        return InPageMessage.MpchainResponse;

      case ContentScriptMessage.CounterBlock:
        return InPageMessage.CounterBlockResponse;

      case ContentScriptMessage.CounterParty:
        return InPageMessage.CounterPartyResponse;
    }
  }
}

new ContentScript();
