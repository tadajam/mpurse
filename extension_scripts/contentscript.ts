import { ContentScriptMessage } from './enum/contentScriptMessage';
import { InPageMessage } from './enum/inPageMessage';


class ContentScript {

  private isAlive = false;
  private port: chrome.runtime.Port;

  constructor() {
    this.isAlive = true;
    this.port = chrome.runtime.connect({name: ContentScriptMessage.PortName});
    this.assignEventHandlers();
    this.port.postMessage({type: ContentScriptMessage.InPageContent});
  }

  assignEventHandlers(): void {
    this.port.onMessage.addListener((message: any, port: chrome.runtime.Port) => {
      if (message && message.type) {
        if (message.type === ContentScriptMessage.InPageContent) {
          this.injectScript(message.script);
        } else {
          window.postMessage({
            action: this.getResponseAction(message.type),
            id: message.id,
            data: message.data
          }, '*');
        }
      }
    });

    window.addEventListener('message', (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.data.action) {
        const data = this.isAlive ? event.data.message : {error: 'Extension context invalidated'};
        if (this.isAlive) {
          this.port.postMessage({type: this.getRequestType(event.data.action), id: event.data.id, origin: event.origin, data: data});
        } else {
          window.postMessage({action: this.getResponseAction(this.getRequestType(event.data.action)), id: event.data.id, data: data}, '*');
        }
      }
    });

    this.port.onDisconnect.addListener(() => {
      this.isAlive = false;
    });

    window.addEventListener('unload', (event: MessageEvent) => {
      this.port.disconnect();
    });
  }

  injectScript(inpageContent: string): void {
    try {
      const container = document.head || document.documentElement;
      const scriptTag = document.createElement('script');
      scriptTag.setAttribute('async', 'false');
      scriptTag.textContent = inpageContent;
      container.insertBefore(scriptTag, container.children[0]);
      container.removeChild(scriptTag);
    } catch (e) {
      console.error('Script injection failed', e);
    }
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

const contentScript = new ContentScript();
