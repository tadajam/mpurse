# Mpurse

Extension for Monaparty.

# Basic Usage

## Via Browser Action

- Generate Passphrase(Electrum Seed Version 1, e.g. counterwallet)
- Import Passphrase(Electrum Seed Version 1, e.g. counterwallet)
- Import Private Key
- Balance
- Send
- Sign Message
- Sign Transaction

## Via Content Script

Inject an instance of Mpurse into a Window object.

### Properties

#### updateEmitter: EventEmitter

Exposes an EventEmitter that emits two events: `stateChanged` and `addressChanged`.

```javascript
window.mpurse.updateEmitter.removeAllListeners()
  .on('stateChanged', isUnlocked => console.log(isUnlocked))
  .on('addressChanged', address => console.log(address));
```

### Methods

- Permission

  Need Approve (Permission required for each origin)
  
  Need Manual Execution (Operations that require a signature)


#### getAddress()

- Permission
  - Need Approve

- Return value
  - **address**: Promise\<string\>

```javascript
const address = await window.mpurse.getAddress();
```

#### sendAsset()

- Permission
  - Need Approve
  - Need Manual Execution

- Parameters

  - **to**: string
  - **asset**: string
  - **amount**: number
  - **memoType**: string ['no' | 'hex' | 'plain']
  - **memoValue**: string

- Return value
  - **txHash**: Promise\<string\>

```javascript
const txHash = await window.mpurse.sendAsset(
  'MLinW5mA2Rnu7EjDQpnsrh6Z8APMBH6rAt',
  'XMP', 
  114.514, 
  'plain',
  'test'
);
```

#### signRawTransaction()

- Permission
  - Need Approve
  - Need Manual Execution

- Parameters
  - **tx**: string

- Return value
  - **signedTx**: Promise\<string\>

```javascript
const signedTx = await window.mpurse.signRawTransaction(tx);
```
#### signMessage()

- Permission
  - Need Approve
  - Need Manual Execution

- Parameters
  - **personalMessage**: string

- Return value
  - **signature**: Promise\<string\>

```javascript
const signature = await window.mpurse.signMessage('Test Message');
```
#### sendRawTransaction()

- Permission
  - Need Approve
  - Need Manual Execution

- Parameters
  - **tx**: string

- Return value
  - **txHash**: Promise\<string\>

```javascript
const txHash = await window.mpurse.sendRawTransaction(tx);
```

#### mpchain()

Mpchain API.

Valid methods are `address`, `asset` , `balance` , `balances` , `bets` , `block` , `broadcasts` , `btcpays` , `burns` , `dividends` , `history` , `holders` , `issuances` , `market` , `markets` , `market_history` , `market_orderbook` , `market_orders` , `mempool` , `network` , `orders` , `order_matches` , `sends` , `send_tx` and `tx`.

For details, see the [document](https://mpchain.info/doc).
- Parameters
  - **method**: string
  - **params**: {  
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

- Return value
  - **result**: Promise\<any\>

```javascript
const mpchainParams = {address: 'MLinW5mA2Rnu7EjDQpnsrh6Z8APMBH6rAt'};
const balance = await window.mpurse.mpchain('balances', mpchainParams);
```

#### counterBlock()

Counterblock API. (via https://mpchain.info/api/cb)

- Parameters
  - **method**: string
  - **params**: any

- Return value
  - **result**: Promise\<any\>

```javascript
const cbParams = {assetsList: ['XMP']};
const assets = await window.mpurse.counterBlock('get_assets_info', cbParams);
```

#### counterParty()

Counterparty API. (via https://mpchain.info/api/cb)

- Parameters
  - **method**: string
  - **params**: any

- Return value
  - **result**: Promise\<any\>

```javascript
const cpParams = {address: 'MLinW5mA2Rnu7EjDQpnsrh6Z8APMBH6rAt'};
const unspentTxouts = await window.mpurse.counterParty('get_unspent_txouts', cpParams);
```
