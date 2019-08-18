export enum ContentScriptMessage {
  PortName = 'mpurse',
  InPageContent = 'mpurse.inpage',
  InPageInit = 'mpurse.init',
  AddressState = 'mpurse.state.address',
  LoginState = 'mpurse.state.login',

  Address = 'mpurse.address',
  SendAsset = 'mpurse.send.asset',
  SignRawTransaction = 'mpurse.sign.tx',
  SignMessage = 'mpurse.sign.message',
  SendRawTransaction = 'mpurse.send.tx.raw',
  SendTransaction = 'mpurse.send.tx',

  Mpchain = 'mpurse.mpchain',
  CounterBlock = 'mpurse.counterblock',
  CounterParty = 'mpurse.counterparty'
}
