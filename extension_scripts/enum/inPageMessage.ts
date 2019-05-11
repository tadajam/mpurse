export enum InPageMessage {
  InitRequest = 'mpurse.init.request',
  InitResponse = 'mpurse.init.response',
  AddressState = 'mpurse.state.address',
  LoginState = 'mpurse.state.login',

  AddressRequest = 'mpurse.address.request',
  AddressResponse = 'mpurse.address.response',
  SendAssetRequest = 'mpurse.send.asset.request',
  SendAssetResponse = 'mpurse.send.asset.response',
  SignRawTransactionRequest = 'mpurse.sign.tx.request',
  SignRawTransactionResponse = 'mpurse.sign.tx.response',
  SignMessageRequest = 'mpurse.sign.message.request',
  SignMessageResponse = 'mpurse.sign.message.response',
  SendRawTransactionRequest = 'mpurse.send.tx.raw.request',
  SendRawTransactionResponse = 'mpurse.send.tx.raw.response',

  MpchainRequest = 'mpurse.mpchain.request',
  MpchainResponse = 'mpurse.mpchain.response',
  CounterBlockRequest = 'mpurse.counterblock.request',
  CounterBlockResponse = 'mpurse.counterblock.response',
  CounterPartyRequest = 'mpurse.counterparty.request',
  CounterPartyResponse = 'mpurse.counterparty.response',
}
