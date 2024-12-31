import * as Electrum1Mnemonic from './external/mnemonic.js';
import * as BitCore from 'bitcore-lib';
import * as BitCoreMnemonic from 'bitcore-mnemonic';
import * as BitCoreMessage from 'bitcore-message';
import { MpchainUtil } from './util.mpchain';

export class BitcoreUtil {
  static NETWORK: any;

  static readonly mainnet = {
    hashGenesisBlock:
      'ff9f1c0116d19de7c9963845e129f9ed1bfc0b376eb54fd7afa42e0d418c8bb6',
    port: 9401,
    portRpc: 9402,
    protocol: { magic: 3686187259 },
    seedsDns: ['dnsseed.monacoin.org'],
    versions: {
      bip32: { private: 76066276, public: 76067358 },
      bip44: 22,
      private: 176,
      private_old: 178,
      public: 50,
      scripthash: 55,
      scripthash2: 5
    },
    name: 'livenet',
    unit: 'MONA',
    testnet: false,
    alias: 'mainnet',
    pubkeyhash: 50,
    privatekey: 176,
    privatekey_old: 178,
    scripthash: 55,
    xpubkey: 76067358,
    xprivkey: 76066276,
    networkMagic: 4223710939,
    dnsSeeds: ['dnsseed.monacoin.org']
  };

  static readonly testnet = {
    hashGenesisBlock:
      'a2b106ceba3be0c6d097b2a6a6aacf9d638ba8258ae478158f449c321061e0b2',
    port: 19403,
    portRpc: 19402,
    protocol: { magic: 4056470269 },
    seedsDns: ['testnet-dnsseed.monacoin.org'],
    versions: {
      bip32: { private: 70615956, public: 70617039 },
      bip44: 1,
      private: 239,
      public: 111,
      scripthash: 117,
      scripthash2: 196
    },
    name: 'testnet',
    unit: 'MONA',
    testnet: true,
    alias: 'testnet',
    pubkeyhash: 111,
    privatekey: 239,
    scripthash: 117,
    xpubkey: 70617039,
    xprivkey: 70615956,
    networkMagic: 4258449649,
    dnsSeeds: ['testnet-dnsseed.monacoin.org']
  };

  static initialize(): void {
    BitCoreMessage.MAGIC_BYTES = BitCore.deps.Buffer(
      'Monacoin Signed Message:\n'
    );

    BitCore.Networks.remove(BitCore.Networks.testnet);
    BitCore.Networks.mainnet = BitCore.Networks.add(this.mainnet);
    BitCore.Networks.testnet = BitCore.Networks.add(this.testnet);
    BitCore.Networks.livenet = BitCore.Networks.mainnet;

    this.NETWORK = BitCore.Networks.livenet;
  }

  static generateRandomMnemonic(
    seedVersion: string,
    seedLanguage: string
  ): string {
    switch (seedVersion) {
      case 'Electrum1':
        return this.generateRandomElectrum1Mnemonic();
      case 'Electrum2':
        return this.generateRandomElectrum2Mnemonic();
      case 'Bip39':
        return this.generateRandomBip39Mnemonic(seedLanguage);
      default:
        return '';
    }
  }

  private static generateRandomElectrum1Mnemonic(): string {
    const mnemonic = new Electrum1Mnemonic(128).toWords();
    return mnemonic.join(' ');
  }

  private static generateRandomElectrum2Mnemonic(): string {
    // TODO : find or write a cool library
    return '';
  }

  private static generateRandomBip39Mnemonic(seedLanguage: string): string {
    let language: any;
    switch (seedLanguage || 'ENGLISH') {
      case 'CHINESE':
        language = BitCoreMnemonic.Words.CHINESE;
        break;
      case 'ENGLISH':
        language = BitCoreMnemonic.Words.ENGLISH;
        break;
      case 'FRENCH':
        language = BitCoreMnemonic.Words.FRENCH;
        break;
      case 'ITALIAN':
        language = BitCoreMnemonic.Words.ITALIAN;
        break;
      case 'JAPANESE':
        language = BitCoreMnemonic.Words.JAPANESE;
        break;
      case 'KOREAN':
        language = BitCoreMnemonic.Words.KOREAN;
        break;
      case 'SPANISH':
        language = BitCoreMnemonic.Words.SPANISH;
        break;
      default:
        language = BitCoreMnemonic.Words.ENGLISH;
        break;
    }
    const mnemonic = new BitCoreMnemonic(language);
    return mnemonic.toString();
  }

  static getHDPrivateKey(
    passphrase: string,
    seedVersion: string
  ): BitCore.PrivateKey {
    switch (seedVersion) {
      case 'Electrum1':
        return this.getHDPrivateKeyFromElectrum1Mnemonic(passphrase);
      case 'Electrum2':
        return this.getHDPrivateKeyFromElectrum2Mnemonic(passphrase);
      case 'Bip39':
        return this.getHDPrivateKeyFromBip39Mnemonic(passphrase);
      default:
        return null;
    }
  }

  private static getHDPrivateKeyFromElectrum1Mnemonic(
    passphrase: string
  ): BitCore.PrivateKey {
    const words = passphrase.toLowerCase().split(' ');
    const seed = new Electrum1Mnemonic(words).toHex();
    return BitCore.HDPrivateKey.fromSeed(seed, this.NETWORK);
  }

  private static getHDPrivateKeyFromElectrum2Mnemonic(
    passphrase: string
  ): BitCore.PrivateKey {
    // TODO : find or write a cool library
    return null;
  }

  private static getHDPrivateKeyFromBip39Mnemonic(
    passphrase: string
  ): BitCore.PrivateKey {
    const code = new BitCoreMnemonic(passphrase);
    return code.toHDPrivateKey();
  }

  static getPrivateKey(
    hDPrivateKey: BitCore.PrivateKey,
    basePath: string,
    index: number
  ): BitCore.PrivateKey {
    return hDPrivateKey.derive(basePath + index).privateKey;
  }

  static getPrivateKeyFromHex(hex: string): BitCore.PrivateKey {
    return new BitCore.PrivateKey(hex, this.NETWORK);
  }

  static getPrivateKeyFromWIF(wif: string): BitCore.PrivateKey {
    return BitCore.PrivateKey.fromWIF(wif, this.NETWORK);
  }

  static getAddress(privateKey: BitCore.PrivateKey): string {
    return privateKey.toAddress(this.NETWORK).toString();
  }

  static hex2WIF(hex: string): string {
    return new BitCore.PrivateKey(hex, this.NETWORK).toWIF();
  }

  static decodeBase58(str: string): Uint8Array {
    return BitCore.encoding.Base58.decode(str);
  }

  static signTransaction(unsignedHex: string, hex: string): Promise<string> {
    return this.rebuildScriptPubKey(unsignedHex).then(tx =>
      tx.sign(this.getPrivateKeyFromHex(hex)).toString()
    );
  }

  static signMessage(message: string, hex: string): string {
    const base64 = BitCoreMessage(message).sign(this.getPrivateKeyFromHex(hex));
    return BitCore.deps.Buffer(base64, 'base64').toString('base64');
  }

  static verify(address: string, message: string, signature: string): boolean {
    return BitCoreMessage(message).verify(address, signature);
  }

  private static async rebuildScriptPubKey(unsignedHex: string): Promise<any> {
    const tx = BitCore.Transaction(unsignedHex);
    for (let i = 0; i < tx.inputs.length; i++) {
      const script = BitCore.Script(tx.inputs[i]._scriptBuffer.toString('hex'));
      let inputObj: any;
      let multiSigInfo: any;

      switch (script.classify()) {
        case BitCore.Script.types.PUBKEY_OUT:
          inputObj = tx.inputs[i].toObject();
          inputObj.output = BitCore.Transaction.Output({
            script: tx.inputs[i]._scriptBuffer.toString('hex'),
            satoshis: 0
          });
          tx.inputs[i] = new BitCore.Transaction.Input.PublicKey(inputObj);
          break;

        case BitCore.Script.types.PUBKEYHASH_OUT:
          inputObj = tx.inputs[i].toObject();
          inputObj.output = BitCore.Transaction.Output({
            script: tx.inputs[i]._scriptBuffer.toString('hex'),
            satoshis: 0
          });
          tx.inputs[i] = new BitCore.Transaction.Input.PublicKeyHash(inputObj);
          break;

        case BitCore.Script.types.MULTISIG_IN:
          inputObj = tx.inputs[i].toObject();
          tx.inputs[i] = MpchainUtil.getScriptPubKey(
            inputObj.prevTxId,
            inputObj.outputIndex
          ).then(result => {
            inputObj.output = BitCore.Transaction.Output({
              script: result['scriptPubKey']['hex'],
              satoshis: BitCore.Unit.fromBTC(result['value']).toSatoshis()
            });
            multiSigInfo = this.extractMultiSigInfoFromScript(
              inputObj.output.script
            );
            inputObj.signatures = BitCore.Transaction.Input.MultiSig.normalizeSignatures(
              tx,
              new BitCore.Transaction.Input.MultiSig(
                inputObj,
                multiSigInfo.publicKeys,
                multiSigInfo.threshold
              ),
              i,
              script.chunks.slice(1, script.chunks.length).map(function(s) {
                return s.buf;
              }),
              multiSigInfo.publicKeys
            );
            return new BitCore.Transaction.Input.MultiSig(
              inputObj,
              multiSigInfo.publicKeys,
              multiSigInfo.threshold
            );
          });
          break;
        case BitCore.Script.types.MULTISIG_OUT:
          inputObj = tx.inputs[i].toObject();
          inputObj.output = BitCore.Transaction.Output({
            script: tx.inputs[i]._scriptBuffer.toString('hex'),
            satoshis: 0
          });
          multiSigInfo = this.extractMultiSigInfoFromScript(
            inputObj.output.script
          );
          tx.inputs[i] = new BitCore.Transaction.Input.MultiSig(
            inputObj,
            multiSigInfo.publicKeys,
            multiSigInfo.threshold
          );
          break;
        case BitCore.Script.types.SCRIPTHASH_OUT:
        case BitCore.Script.types.DATA_OUT:
        case BitCore.Script.types.PUBKEY_IN:
        case BitCore.Script.types.PUBKEYHASH_IN:
        case BitCore.Script.types.SCRIPTHASH_IN:
          break;
        default:
          throw new Error(
            'Unknown scriptPubKey [' +
              script.classify() +
              '](' +
              script.toASM() +
              ')'
          );
      }
    }
    tx.inputs = await Promise.all(tx.inputs);
    return tx;
  }

  private static extractMultiSigInfoFromScript(script: any): any {
    const nKeysCount =
      BitCore.Opcode(
        script.chunks[script.chunks.length - 2].opcodenum
      ).toNumber() -
      BitCore.Opcode.map.OP_1 +
      1;
    const threshold =
      BitCore.Opcode(
        script.chunks[script.chunks.length - nKeysCount - 2 - 1].opcodenum
      ).toNumber() -
      BitCore.Opcode.map.OP_1 +
      1;
    return {
      publicKeys: script.chunks
        .slice(script.chunks.length - 2 - nKeysCount, script.chunks.length - 2)
        .map((pubKey: any) => {
          return BitCore.PublicKey(pubKey.buf);
        }),
      threshold: threshold
    };
  }
}

BitcoreUtil.initialize();
