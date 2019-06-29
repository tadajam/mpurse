import { Component, OnInit, NgZone, EventEmitter } from '@angular/core';
import { FormControl, Validators, FormGroup, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BackgroundService } from '../../services/background.service';
import { filter, flatMap, toArray, map, tap, concat, concatAll, concatMap, reduce } from 'rxjs/operators';
import { from, Observable, EMPTY } from 'rxjs';
import { MatSnackBar, MatSelectChange } from '@angular/material';
import { Decimal } from 'decimal.js';

@Component({
  selector: 'app-send',
  templateUrl: './send.component.html',
  styleUrls: ['./send.component.scss']
})
export class SendComponent implements OnInit {

  request = false;
  id = 0;
  origin = '';

  hasAssignedTo = false;
  hasAssignedAsset = false;
  hasAssignedAmount = false;
  hasAssignedMemoType = false;
  hasAssignedMemoValue = false;

  accountSummary: {
    address: string,
    name: string,
    isImport: boolean,
    mona_balance: string,
    xmp_balance: string,
    assets: {
      held: number,
      owned: number
    }
  } = {address: '', name: '', isImport: false, mona_balance: '', xmp_balance: '', assets: {held: 0, owned: 0}};

  assets: {
    asset: string,
    asset_longname: string,
    description: string,
    estimated_value: {mona: string, usd: string, xmp: string},
    quantity: string
  }[] = [];

  unsignedTx = '';
  calculatedFee = 0;

  fromControl = new FormControl('', [Validators.required]);
  toControl = new FormControl('', [Validators.required]);
  amountControl = new FormControl(0, [
    Validators.required,
    Validators.pattern(/^([1-9][0-9]{0,9}|0)(\.[0-9]{1,8})?$/),
    Validators.min(0.00000001)
  ]);

  memoTypeControl = new FormControl('no', [Validators.required]);
  memoValueControl = new FormControl('', []);

  memoGroup = new FormGroup({
    memoType: this.memoTypeControl,
    memoValue: this.memoValueControl
  }, {validators: this.memoValidator});

  assetControl = new FormControl('MONA', [Validators.required]);
  feeControl = new FormControl(201, [Validators.required, Validators.min(101)]);

  sendForm = new FormGroup({
    from: this.fromControl,
    to: this.toControl,
    amount: this.amountControl,
    asset: this.assetControl,
    memo: this.memoGroup,
    fee: this.feeControl
  });

  memoValidator(group: FormGroup): ValidationErrors | null {
    const emptyValidator = group.controls.memoType.value === 'no' ? true : group.controls.memoValue.value !== '';
    const hexValidator = group.controls.memoType.value === 'hex' ? group.controls.memoValue.value.match(/^([0-9a-f][0-9a-f])+$/) : true;
    return emptyValidator && hexValidator ? null : {'invalidMemo': true};
  }

  constructor(
    private zone: NgZone,
    private route: ActivatedRoute,
    private router: Router,
    public snackBar: MatSnackBar,
    private backgroundService: BackgroundService
  ) { }

  ngOnInit() {
    this.route.queryParams
      .pipe(
        filter(params => params.request || params.to || params.amount || params.asset),
        tap(params => {
          if (params.request) {
            this.request = true;
          } else {
            if (params.to) {
              this.toControl.setValue(params.to);
              this.hasAssignedTo = true;
            }
            if (params.amount) {
              this.amountControl.setValue(params.amount);
              this.hasAssignedAmount = true;
            }
            if (params.asset) {
              this.assetControl.setValue(params.asset);
              this.hasAssignedAsset = true;
            }
            if (params.memoType) {
              this.memoTypeControl.setValue(params.memoType);
              this.hasAssignedMemoType = true;
            }
            if (params.memoValue) {
              this.memoValueControl.setValue(params.memoValue);
              this.hasAssignedMemoValue = true;
            }
          }
        }),
        filter(params => params.request),
        flatMap(params => this.backgroundService.getPendingRequest(params.id)),
        filter(request => request)
      )
      .subscribe(request => {
        this.zone.run(() => {
          this.id = request.id;
          this.origin = request.origin;
          if (request.data.to !== '') {
            this.toControl.setValue(request.data.to);
            this.hasAssignedTo = true;
          }
          if (request.data.asset !== '') {
            this.assetControl.setValue(request.data.asset);
            this.hasAssignedAsset = true;
          }
          if (request.data.amount > 0) {
            this.amountControl.setValue(request.data.amount);
            this.hasAssignedAmount = true;
          }

          if (request.data.memoType === 'no' || request.data.memoType === 'hex' || request.data.memoType === 'plain') {
            this.memoTypeControl.setValue(request.data.memoType);
            this.hasAssignedMemoType = true;
            if (request.data.memoType === 'no') {
              this.hasAssignedMemoValue = true;
            } else {
              if (request.data.memoValue !== '') {
                this.memoValueControl.setValue(request.data.memoValue);
                this.hasAssignedMemoValue = true;
              }
            }
          }
        });
      });

    // this.route.queryParams
    //   .pipe(filter(params => params.to || params.amount || params.asset))
    //   .subscribe(params => {
    //     if (params.to) {
    //       this.toControl.setValue(params.to);
    //     }

    //     if (params.amount) {
    //       this.amountControl.setValue(params.amount);
    //     }

    //     if (params.asset) {
    //       this.assetControl.setValue(params.asset);
    //     }
    //   });

    this.backgroundService.getSelectedAddress()
      .pipe(
        flatMap(address => this.backgroundService.getAccountSummary(address)),
        flatMap(accountSummary => {
          this.zone.run(() => {
            this.accountSummary = accountSummary;
            this.fromControl.setValue(accountSummary.address);
          });

          const getBalances: Observable<any>[] = [];
          const limit = 500;
          const apiCount = new Decimal(accountSummary.assets.held).div(new Decimal(limit)).toNumber();
          for (let i = 0; i < apiCount; i++) {
            const getbalance = this.backgroundService.getBalances(this.accountSummary.address, i + 1, limit)
              .pipe(map(balaces => balaces.data));
            getBalances.push(getbalance);
          }
          return getBalances;
        }),
        concatMap(getBalances => getBalances),
        reduce((pasts, current) => {
          return pasts.concat(current);
        })
      )
      .subscribe({
        next: assets => this.zone.run(() => this.assets = assets),
        error: error => {
          this.zone.run(() => {
            this.snackBar.open(error.toString(), '', {duration: 3000});
          });
        }
      });

    this.sendForm.valueChanges
      .pipe(
        tap(() => {
          this.unsignedTx = '';
          this.calculatedFee = 0;
        }),
        filter(() => this.sendForm.valid),
      ).subscribe(() => this.createSend());
  }

  getAvailable(asset: string): string {
    const assetInfo = this.assets.filter(value => value.asset === asset);
    if (assetInfo.length > 0) {
      return assetInfo[0].quantity;
    } else if (asset === 'MONA') {
      return this.accountSummary.mona_balance;
    } else {
      return '0';
    }
  }

  getAvailableNumber(asset: string): number {
    return Number(this.getAvailable(asset));
  }

  setAvailableAllFunds(): void {
    this.amountControl.setValue(this.getAvailable(this.assetControl.value));
  }

  feeChange(event: any) {
    this.feeControl.setValue(event.value);
  }

  isAssetAvailable(): boolean {
    return this.amountControl.value <= this.getAvailable(this.assetControl.value);
  }

  isFeeAvailable(): boolean {
    let monaAvailable = Number(this.getAvailable('MONA'));
    const fee = new Decimal(this.feeControl.value).div(100000000).toNumber();
    if (this.assetControl.value === 'MONA') {
      monaAvailable -= Number(this.amountControl.value);
    }
    return fee <= monaAvailable;
  }

  createSendObservable(disableUtxoLocks: boolean): Observable<any> {
    return this.backgroundService.getAsset(this.assetControl.value)
      .pipe(
        flatMap(assetInfo => {
          let amount: number;
          if (assetInfo['divisible']) {
            amount = new Decimal(this.amountControl.value).times(new Decimal(100000000)).toNumber();
          } else {
            amount = new Decimal(this.amountControl.value).toNumber();
          }
          return this.backgroundService.createSend(
            this.fromControl.value,
            this.toControl.value,
            this.assetControl.value,
            amount,
            this.memoTypeControl.value === 'no' ? '' : this.memoValueControl.value,
            this.memoTypeControl.value === 'hex',
            new Decimal(this.feeControl.value).times(new Decimal(1000)).toNumber(),
            disableUtxoLocks
          );
        })
      );
  }

  createSend() {
    this.unsignedTx = '';
    this.calculatedFee = 0;
    this.createSendObservable(true)
      .subscribe({
        next: result => {
          this.zone.run(() => {
            this.unsignedTx = result.tx_hex;
            this.calculatedFee = result.btc_fee;
          });
        },
        error: error => {
          this.zone.run(() => {
            this.snackBar.open(this.backgroundService.interpretError(error), '', {duration: 3000});
          });
        }
      });
  }

  send() {
    if (this.request) {
      this.createSendObservable(false)
        .pipe(
          flatMap(result => this.backgroundService.send(result.tx_hex)),
          flatMap(result => this.backgroundService.shiftRequest(true, this.id, {txHash: result.tx_hash}))
        )
        .subscribe({
          next: () => this.backgroundService.closeWindow(),
          error: error => this.zone.run(() => this.snackBar.open(error.toString(), '', {duration: 3000}))
        });
    } else {
      this.createSendObservable(false)
      .pipe(
        flatMap(result => this.backgroundService.send(result.tx_hex))
      )
      .subscribe({
        next: result => {
          this.zone.run(() => {
            this.snackBar.open('Funds sent. tx_hash: ' + result.tx_hash, '', {duration: 5000, panelClass: 'break-all'});
            this.router.navigate(['/home']);
          });
        },
        error: error => {
          this.zone.run(() => {
            this.snackBar.open(this.backgroundService.interpretError(error), '', {duration: 3000});
          });
        }
      });
    }


  }

  cancel() {
    if (this.request) {
      this.backgroundService.shiftRequest(false, this.id, {error: 'User Cancelled'})
        .subscribe({
          next: () => this.backgroundService.closeWindow(),
          error: error => this.zone.run(() => this.snackBar.open(error.toString(), '', {duration: 3000}))
        });
    } else {
      this.zone.run(() => this.router.navigate(['/home']));
    }
  }
}
