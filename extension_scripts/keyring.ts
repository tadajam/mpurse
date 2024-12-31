import { BitcoreUtil } from './util.bitcore';

export interface Hdkey {
  seedVersion: string;
  basePath: string;
  mnemonic: string;
  numberOfAccounts: number;
}

interface Account {
  index: number;
  address: string;
  privatekey: string;
  publickey: string;
}

export class Keyring {
  private hdkey: Hdkey;
  private privatekeys: string[];
  private accounts: Account[];

  constructor() {
    this.hdkey = {
      seedVersion: '',
      basePath: '',
      mnemonic: '',
      numberOfAccounts: 0
    };
    this.privatekeys = [];

    this.accounts = [];
  }

  deserialize(
    passphrase: string,
    seedVersion: string,
    basePath: string,
    numberOfAccounts: number,
    privatekeys: string[]
  ): void {
    this.hdkey = {
      seedVersion: seedVersion,
      basePath: basePath,
      mnemonic: passphrase,
      numberOfAccounts: numberOfAccounts
    };
    this.privatekeys = privatekeys;

    this.accounts = [];
    const hdPrivateKey = BitcoreUtil.getHDPrivateKey(passphrase, seedVersion);
    for (let i = 0; i < numberOfAccounts; i++) {
      this.setAccount(BitcoreUtil.getPrivateKey(hdPrivateKey, basePath, i), i);
    }
    for (let i = 0; i < privatekeys.length; i++) {
      this.setAccount(BitcoreUtil.getPrivateKeyFromWIF(privatekeys[i]), -1);
    }
  }

  serialize(): { hdkey: Hdkey; privatekeys: string[] } {
    return { hdkey: this.hdkey, privatekeys: this.privatekeys };
  }

  getPassphrase(): string {
    return this.hdkey.mnemonic;
  }

  getHdkey(): Hdkey {
    return this.hdkey;
  }

  getPrivatekey(address: string): string {
    const account = this.accounts.find(value => value.address === address);
    let wif = '';
    if (account) {
      wif = BitcoreUtil.hex2WIF(account.privatekey);
    }

    return wif;
  }

  setAccount(privatekey: any, index: number): void {
    const address = BitcoreUtil.getAddress(privatekey);

    if (!this.accounts.some(value => value.address === address)) {
      this.accounts.push({
        index: index,
        address: address,
        privatekey: privatekey.toString(),
        publickey: privatekey.toPublicKey().toString()
      });
    }
  }

  addAccount(): Account {
    const hdPrivateKey = BitcoreUtil.getHDPrivateKey(
      this.hdkey.mnemonic,
      this.hdkey.seedVersion
    );
    const privatekey = BitcoreUtil.getPrivateKey(
      hdPrivateKey,
      this.hdkey.basePath,
      this.hdkey.numberOfAccounts
    );
    this.setAccount(privatekey, this.hdkey.numberOfAccounts);
    this.hdkey.numberOfAccounts++;
    return this.getAccount(BitcoreUtil.getAddress(privatekey));
  }

  importAccount(wif: string): Account {
    const privatekey = BitcoreUtil.getPrivateKeyFromWIF(wif);
    this.setAccount(privatekey, -1);
    this.privatekeys.push(wif);
    return this.getAccount(BitcoreUtil.getAddress(privatekey));
  }

  removeAccount(address: string): void {
    const account = this.accounts.find(value => value.address === address);
    let wif = '';
    if (account) {
      wif = BitcoreUtil.hex2WIF(account.privatekey);
    }
    this.privatekeys = this.privatekeys.filter(value => value !== wif);
    this.accounts = this.accounts.filter(value => value.address !== address);
  }

  getAccount(address: string): Account {
    return this.accounts.find(value => value.address === address);
  }

  getAccounts(): Account[] {
    return this.accounts;
  }

  containsPrivatekey(wif: string): boolean {
    return this.accounts.some(
      value =>
        value.privatekey === BitcoreUtil.getPrivateKeyFromWIF(wif).toString()
    );
  }

  generateRandomMnemonic(seedVersion: string, seedLanguage: string): string {
    return BitcoreUtil.generateRandomMnemonic(seedVersion, seedLanguage);
  }

  decodeBase58(address: string): Uint8Array {
    return BitcoreUtil.decodeBase58(address);
  }

  signTransaction(tx: string, address: string): Promise<string> {
    const account = this.accounts.find(value => value.address === address);
    return BitcoreUtil.signTransaction(tx, account.privatekey);
  }

  signMessage(message: string, address: string): string {
    const account = this.accounts.find(value => value.address === address);
    return BitcoreUtil.signMessage(message, account.privatekey);
  }
}
