import * as CryptoJS from 'crypto-js';

export class EncryptUtil {
  static encrypt(message: string, password: string): string {
    return CryptoJS.AES.encrypt(message, password).toString();
  }

  static decrypt(cryptedMessage: string, password: string): string {
    return CryptoJS.enc.Utf8.stringify(
      CryptoJS.AES.decrypt(cryptedMessage, password)
    );
  }

  static createCheckSum(password: string): string {
    return CryptoJS.SHA256(password).toString(CryptoJS.enc.Base64);
  }
}
