interface AddressInfo {
  address: string;
  assets: {
    held: number,
    owned: number
  };
  estimated_value: {
    mona: string,
    usd: string,
    xmp: string
  };
  mona_balance: string;
  xmp_balance: string;
}

interface Asset {
  asset: string;
  asset_id: number;
  asset_longname: string;
  block_index: number;
  description: string;
  divisible: boolean;
  estimated_value: {
    mona: string,
    usd: string,
    xmp: string
  };
  issuer: string;
  listed: boolean;
  locked: boolean;
  owner: string;
  reassignable: boolean;
  supply: string;
  timestamp: number;
  type: string;
}

interface Balance {
  address: string;
  data: {
    asset: string,
    asset_longname: string,
    description: string,
    estimated_value: {
      mona: string,
      usd: string,
      xmp: string
    }
    quantity: string
  }[];
  total: number;
}

interface Params {
  address?: string;
  asset?: string;
  block?: number;
  tx_index?: number;
  tx_hash?: string;
  tx_hex?: string;
  base_asset?: string;
  quote_asset?: string;
  page?: number;
  limit?: number;
}

export class MpchainUtil {

  static API_URL = 'https://mpchain.info/api/';

  private constructor() { }

  private static httpGet(apiString: string): Promise<any> {
    const request = new XMLHttpRequest();
    return new Promise(resolve => {
      request.addEventListener('load', () => {
        const json = JSON.parse(request.response);
        resolve(json);
      });
      request.open('GET', this.API_URL + apiString);
      request.send();
    });
  }

  private static httpPost(apiString: string, params: string): Promise<any> {
    const request = new XMLHttpRequest();
    return new Promise((resolve, reject) => {
      request.addEventListener('load', () => {
        let json: any;
        try {
          json = JSON.parse(request.response);
        } catch (e) {
          json = {error: 'api dead'};
        }
        if ('code' in json || 'error' in json) {
          reject(json);
        } else {
          resolve(json);
        }
      });
      request.open('POST', this.API_URL + apiString);
      request.setRequestHeader('Content-Type', 'application/json');
      request.send(params);
    });
  }

  static mp(method: string, params: Params): Promise<any> {
    if (! this.isObject(params)) {
      return Promise.reject({error: 'Invalid argument'});
    }
    let apiString = method;
    switch (method) {
      case 'send_tx':
        if ('tx_hex' in params) {
          return this.httpPost(method, JSON.stringify(params));
        } else {
          return Promise.reject({error: 'Invalid argument'});
        }
      case 'balance':
        if (! ('address' in params) || ! ('asset' in params)) {
          return Promise.reject({error: 'Invalid argument'});
        }
        apiString += '/' + params.address + '/' + params.asset;
        break;
      case 'market':
        if (! ('base_asset' in params) || ! ('quote_asset' in params)) {
          return Promise.reject({error: 'Invalid argument'});
        }
        apiString += '/' + params.base_asset + '/' + params.quote_asset;
        break;
      case 'market_history':
        if (! ('base_asset' in params) || ! ('quote_asset' in params)) {
          return Promise.reject({error: 'Invalid argument'});
        }
        apiString = 'market/' + params.base_asset + '/' + params.quote_asset + '/history';
        apiString += params.address ? '/' + params.address : '';
        break;
      case 'market_orderbook':
        if (! ('base_asset' in params) || ! ('quote_asset' in params)) {
          return Promise.reject({error: 'Invalid argument'});
        }
        apiString = 'market/' + params.base_asset + '/' + params.quote_asset + '/orderbook';
        apiString += params.address ? '/' + params.address : '';
        break;
      case 'market_orders':
        if (! ('base_asset' in params) || ! ('quote_asset' in params) || ! ('address' in params)) {
          return Promise.reject({error: 'Invalid argument'});
        }
        apiString = 'market/' + params.base_asset + '/' + params.quote_asset + '/orders/' + params.address;
        break;
      default:
        let paramStr = 'address' in params ? params.address : '';
        paramStr += 'asset' in params ? params.asset : '';
        paramStr += 'block' in params ? params.block.toString() : '';
        paramStr += 'tx_index' in params ? params.tx_index.toString() : '';
        paramStr += 'tx_hash' in params ? params.tx_hash : '';
        apiString += '/' + paramStr;
    }
    if ('page' in params) {
      apiString += '/' + params.page;
      apiString += 'limit' in params ? '/' + params.limit : '';
    }
    return this.httpGet(apiString);
  }

  static getAddressInfo(address: string): Promise<AddressInfo> {
    return this.mp('address', {address: address});
  }

  static getAsset(asset: string): Promise<Asset> {
    return this.mp('asset', {asset: asset});
  }

  static getBalances(address: string, page: number, limit: number): Promise<Balance> {
    return this.mp('balances', {address: address, page: page, limit: limit});
  }

  static getMempool(address: string, page: number, limit: number): Promise<any> {
    return this.mp('mempool', {address: address, page: page, limit: limit});
  }

  static sendTx(tx_hex: string): Promise<string> {
    return this.mp('send_tx', {tx_hex: tx_hex});
  }

  // static getAddressInfo(address: string): Promise<AddressInfo> {
  //   return this.httpGet('address/' + address);
  // }

  // static getAsset(asset: string): Promise<Asset> {
  //   return this.httpGet('asset/' + asset);
  // }

  // static getBalances(address: string, page: number, limit: number): Promise<Balance> {
  //   return this.httpGet('balances/' + address + '/' + page + '/' + limit);
  // }

  // static getMempool(address: string, page: number, limit: number): Promise<any> {
  //   return this.httpGet('mempool/' + address + '/' + page + '/' + limit);
  // }

  // static sendTx(tx_hex: string): Promise<string> {
  //   return this.httpPost('send_tx/', JSON.stringify({tx_hex: tx_hex}));
  // }

  // counterblock

  static cb(method: string, params: any): Promise<any> {
    if (! this.isObject(params)) {
      return Promise.reject({error: 'Invalid argument'});
    }
    const postParams = {
      'jsonrpc': '2.0',
      'id': 0,
      'method': method,
      'params': params
    };
    return this.httpPost('cb/', JSON.stringify(postParams))
      .then(result => new Promise(resolve => resolve(result.result)));
  }

  static cp(method: string, params: any): Promise<any> {
    if (! this.isObject(params)) {
      return Promise.reject({error: 'Invalid argument'});
    }
    const cbParams = {
      'method': method,
      'params': params
    };
    return this.cb('proxy_to_counterpartyd', cbParams);
  }

  // static getUnspentTxouts(address: string): Promise<any> {
  //   return this.cp('get_unspent_txouts', {address: address});
  // }

  static createSend(source: string, destination: string, asset: string,
    quantity: number, memo: string, memo_is_hex: boolean, fee_per_kb: number, disableUtxoLocks: boolean): Promise<any> {
    const cpParams = {
      source: source,
      destination: destination,
      asset: asset,
      quantity: quantity,
      memo: memo,
      memo_is_hex: memo_is_hex,
      fee_per_kb: fee_per_kb,
      allow_unconfirmed_inputs: true,
      extended_tx_info: true,
      disable_utxo_locks: disableUtxoLocks
    };
    return this.cp('create_send', cpParams);
  }

  static getScriptPubKey(tx_hash: string, vout_index: number): Promise<any> {
    const cbParams = {tx_hash: tx_hash, vout_index: vout_index};
    return this.cb('get_script_pub_key', cbParams);
  }

  // static getChainAddressInfo(address: string): Promise<any> {
  //   const cbParams = {addresses: [address], with_uxtos: false, with_last_txn_hashes: 0};
  //   return this.cb('get_chain_address_info', cbParams);
  // }

  private static isObject(obj: any): boolean {
    return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase() === 'object';
  }
}
