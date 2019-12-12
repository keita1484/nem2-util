import { 
  Account, 
  Address,
  AggregateTransaction,
  AliasAction,
  AliasTransaction,
  Deadline, 
  MultisigAccountModificationTransaction,
  Mosaic,
  MosaicAliasTransaction,
  MosaicDefinitionTransaction,
  MosaicFlags,
  MosaicNonce,
  MosaicId,
  MosaicSupplyChangeAction,
  MosaicSupplyChangeTransaction,
  NamespaceId,
  NamespaceRegistrationTransaction,
  PlainMessage,
  SignedTransaction,
  Transaction,
  Listener,
  UInt64,
  MultisigCosignatoryModification,
  CosignatoryModificationAction,
  TransferTransaction,
  EmptyMessage,
  HashLockTransaction,
  NetworkCurrencyMosaic,
  CosignatureTransaction,
  TransactionHttp,
  NetworkType
  } from 'nem2-sdk';
  import {filter, map, mergeMap} from "rxjs/operators";
  import { txHttp, getNetworkType, listenerUtil } from './nem2-util';
  require('dotenv').config({path: __dirname + '/../.env'});
  const { GENERATION_HASH, CATAPULT_URL, MASTER_PRIVATE_KEY } = process.env;

  // ******************************************************
  // Get Namespaces
  // ******************************************************
  export const registerNamespaces = (rootName: string, duration: number, subName01?: string, subName02?: string) => {
    const name = {
      rootName: rootName,
      subName01: subName01,
      subName02: subName02
    };
    let namespaceId: NamespaceId;
    const ownerAccount: Account = Account.createFromPrivateKey(MASTER_PRIVATE_KEY, getNetworkType());
    const linkingAddress: Address = Address.createFromRawAddress(
      ownerAccount.address.plain(),
    );
    const registerRootNsTx = NamespaceRegistrationTransaction.createRootNamespace(
      Deadline.create(),
      name.rootName,
      UInt64.fromUint(duration),
      getNetworkType(),
    );

    let aggregateTx: AggregateTransaction;
    let registerSubRootNs01Tx: NamespaceRegistrationTransaction;
    let registerSubRootNs02Tx: NamespaceRegistrationTransaction;
    let addressAliasTx: AliasTransaction;

    if(name.subName01 === undefined) {
      namespaceId = new NamespaceId(name.rootName); 
      addressAliasTx = AliasTransaction.createForAddress(
        Deadline.create(),
        AliasAction.Link,
        namespaceId,
        linkingAddress,
        getNetworkType()
      );
      aggregateTx = AggregateTransaction.createComplete(
        Deadline.create(),
        [
          registerRootNsTx.toAggregate(ownerAccount.publicAccount),
          addressAliasTx.toAggregate(ownerAccount.publicAccount)
        ],
        getNetworkType(),
        [],
      );

    } else if (name.subName01 !== undefined && name.subName02 === undefined){
      namespaceId = new NamespaceId(name.rootName + '.' + name.subName01); 
      registerSubRootNs01Tx = NamespaceRegistrationTransaction.createSubNamespace(
        Deadline.create(),
        name.subName01,
        name.rootName,
        getNetworkType(),
      );
      addressAliasTx = AliasTransaction.createForAddress(
        Deadline.create(),
        AliasAction.Link,
        namespaceId,
        linkingAddress,
        getNetworkType()
      );
      aggregateTx = AggregateTransaction.createComplete(
        Deadline.create(),
        [
          registerRootNsTx.toAggregate(ownerAccount.publicAccount),
          registerSubRootNs01Tx.toAggregate(ownerAccount.publicAccount),
          addressAliasTx.toAggregate(ownerAccount.publicAccount)
        ],
        getNetworkType(),
        [],
      );

    } else {
      namespaceId = new NamespaceId(name.rootName + '.' + name.subName01  + '.' + name.subName02); 
      registerSubRootNs01Tx = NamespaceRegistrationTransaction.createSubNamespace(
        Deadline.create(),
        name.subName01,
        name.rootName,
        getNetworkType(),
      );
      registerSubRootNs02Tx = NamespaceRegistrationTransaction.createSubNamespace(
        Deadline.create(),
        name.subName02,
        name.rootName + '.' + name.subName01,
        getNetworkType(),
      );
      addressAliasTx = AliasTransaction.createForAddress(
        Deadline.create(),
        AliasAction.Link,
        namespaceId,
        linkingAddress,
        getNetworkType()
      );
      aggregateTx = AggregateTransaction.createComplete(
        Deadline.create(),
        [
          registerRootNsTx.toAggregate(ownerAccount.publicAccount),
          registerSubRootNs01Tx.toAggregate(ownerAccount.publicAccount),
          registerSubRootNs02Tx.toAggregate(ownerAccount.publicAccount),
          addressAliasTx.toAggregate(ownerAccount.publicAccount)
        ],
        getNetworkType(),
        [],
      );
    }
    
    const signedTx: SignedTransaction = ownerAccount.sign(aggregateTx, GENERATION_HASH);
  
    txHttp
      .announce(signedTx)
      .subscribe(() => {
        console.log('[Transaction announced]');
        console.log('Endpoint: %s/transaction/%s', CATAPULT_URL, signedTx.hash);
      },err => {
        console.error('txHttp error:', err);
      });
  }


  export const transferTx = () => {
    const recipientAddress = Address.createFromRawAddress('TAJCI46QSRGJCWJCAXN4ZL7EDPHEZR6HIYEEUPSH');

    const transferTransaction = TransferTransaction.create(
      Deadline.create(),
      recipientAddress,
      [NetworkCurrencyMosaic.createRelative(100000000)],
      PlainMessage.create('This is a test message'),
      NetworkType.TEST_NET);
    /* end block 01 */

    /* start block 02 */
    const privateKey = '94ACB9FB6CFBF8926F2AD6D345A8FD2BB705FF89E4AE26AB80862A5FA55C9175';
    const account = Account.createFromPrivateKey(privateKey, getNetworkType());
    const networkGenerationHash = '69668447A52FBC498FBE212E536FD3E3A2CFFADA1CCC333B8560C18661017C16';

    const signedTransaction = account.sign(transferTransaction, networkGenerationHash);
    /* end block 02 */

    /* start block 03 */
    const transactionHttp = new TransactionHttp('http://localhost:3000');
    transactionHttp
        .announce(signedTransaction)
        .subscribe(x => {
          console.log(signedTransaction.hash);
          console.log(x);
        }, err => console.error(err));
  }
  

  // アプリ
  // 1. アカウント作成
  // 2. 連署アセットアカウント取得
  // 3. アセット売却（自分を連署者から削除 & 購入者を連署者に追加）
  // 4. アセット購入（売却者を連署者から削除 & 購入者を連署者に追加）

  // ******************************************************
  // 1. Create user account
  // ******************************************************
  export const createUserAccount = () => {
    const account = Account.generateNewAccount(getNetworkType());
    console.log('Address:', account.address.plain(), 'PrivateKey:', account.privateKey);
  }

  // ダッシュボード
  // 1. アセットモザイク作成
  // 2. アセットアカウント作成 → マルチシグアカウント化（マスターを連署者に追加）
  // 3. アセットモザイクを２のアカウントへ送信
  // 4. 連署アカウント一覧
  // 5. アセットアカウントの連署者を購入者に変更


  // ******************************************************
  // 1. Get Namespace & Mosaic
  // ******************************************************
  export const registerNsMosaic = (rootName: string, duration: number, ammount: number, subName01?: string, subName02?: string) => {
    const name = {
      rootName: rootName,
      subName01: subName01,
      subName02: subName02
    };    
    let namespaceId: NamespaceId;
    const ownerAccount: Account = Account.createFromPrivateKey(MASTER_PRIVATE_KEY, getNetworkType());
    const registerRootNsTx = NamespaceRegistrationTransaction.createRootNamespace(
      Deadline.create(),
      name.rootName,
      UInt64.fromUint(duration),
      getNetworkType(),
    );
    // モザイク定義
    const nonce: MosaicNonce = MosaicNonce.createRandom();
    const mosaicId: MosaicId = MosaicId.createFromNonce(
      nonce,
      ownerAccount.publicAccount,
    );
    const mosaicDefTx: MosaicDefinitionTransaction = MosaicDefinitionTransaction.create(
      Deadline.create(),
      nonce,
      mosaicId,
      MosaicFlags.create(false, true, true),
      0,
      UInt64.fromUint(0),
      getNetworkType(),
    );
    const mosaicChangeTx: MosaicSupplyChangeTransaction = MosaicSupplyChangeTransaction.create(
      Deadline.create(),
      mosaicDefTx.mosaicId,
      MosaicSupplyChangeAction.Increase,
      UInt64.fromUint(ammount),
      getNetworkType(),
    );

    let aggregateTx: AggregateTransaction;
    let registerSubRootNs01Tx: NamespaceRegistrationTransaction;
    let registerSubRootNs02Tx: NamespaceRegistrationTransaction;
    let moisacAliasTx: MosaicAliasTransaction;

    if(name.subName01 === undefined) {
      namespaceId = new NamespaceId(name.rootName); 
      moisacAliasTx = MosaicAliasTransaction.create(
        Deadline.create(),
        AliasAction.Link,
        namespaceId,
        mosaicId,
        getNetworkType(),
      );
      aggregateTx = AggregateTransaction.createComplete(
        Deadline.create(),
        [
          registerRootNsTx.toAggregate(ownerAccount.publicAccount),
          mosaicDefTx.toAggregate(ownerAccount.publicAccount),
          mosaicChangeTx.toAggregate(ownerAccount.publicAccount),
          moisacAliasTx.toAggregate(ownerAccount.publicAccount)
        ],
        getNetworkType(),
        [],
      );

    } else if (name.subName01 !== undefined && name.subName02 === undefined){
      namespaceId = new NamespaceId(name.rootName + '.' + name.subName01); 
      registerSubRootNs01Tx = NamespaceRegistrationTransaction.createSubNamespace(
        Deadline.create(),
        name.subName01,
        name.rootName,
        getNetworkType(),
      );
      moisacAliasTx = MosaicAliasTransaction.create(
        Deadline.create(),
        AliasAction.Link,
        namespaceId,
        mosaicId,
        getNetworkType(),
      );
      aggregateTx = AggregateTransaction.createComplete(
        Deadline.create(),
        [
          registerRootNsTx.toAggregate(ownerAccount.publicAccount),
          registerSubRootNs01Tx.toAggregate(ownerAccount.publicAccount),
          mosaicDefTx.toAggregate(ownerAccount.publicAccount),
          mosaicChangeTx.toAggregate(ownerAccount.publicAccount),
          moisacAliasTx.toAggregate(ownerAccount.publicAccount)
        ],
        getNetworkType(),
        [],
      );

    } else {
      namespaceId = new NamespaceId(name.rootName + '.' + name.subName01  + '.' + name.subName02); 
      registerSubRootNs01Tx = NamespaceRegistrationTransaction.createSubNamespace(
        Deadline.create(),
        name.subName01,
        name.rootName,
        getNetworkType(),
      );
      registerSubRootNs02Tx = NamespaceRegistrationTransaction.createSubNamespace(
        Deadline.create(),
        name.subName02,
        name.rootName + '.' + name.subName01,
        getNetworkType(),
      );
      moisacAliasTx = MosaicAliasTransaction.create(
        Deadline.create(),
        AliasAction.Link,
        namespaceId,
        mosaicId,
        getNetworkType(),
      );
      aggregateTx = AggregateTransaction.createComplete(
        Deadline.create(),
        [
          registerRootNsTx.toAggregate(ownerAccount.publicAccount),
          registerSubRootNs01Tx.toAggregate(ownerAccount.publicAccount),
          registerSubRootNs02Tx.toAggregate(ownerAccount.publicAccount),
          mosaicDefTx.toAggregate(ownerAccount.publicAccount),
          mosaicChangeTx.toAggregate(ownerAccount.publicAccount),
          moisacAliasTx.toAggregate(ownerAccount.publicAccount)
        ],
        getNetworkType(),
        [],
      );
    }
    
    const signedTx: SignedTransaction = ownerAccount.sign(aggregateTx, GENERATION_HASH);
  
    txHttp
      .announce(signedTx)
      .subscribe(() => {
        console.log('[Transaction announced]');
        console.log('Endpoint: %s/transaction/%s', CATAPULT_URL, signedTx.hash);
      },err => {
        console.error('txHttp error:', err);
      });
  }
  

  // ******************************************************
  // 2. Convert asset multisig account
  // ******************************************************
  export const convertAssetAccount = async () => {
    const masterAccount = Account.createFromPrivateKey(MASTER_PRIVATE_KEY, getNetworkType());
    const generateAccount = (tag: string) => {
      const account = Account.generateNewAccount(getNetworkType());
      console.log(`--- account info ${tag} ---`);
      console.log(`address: ${account.address.plain()}`);
      console.log(`public key: ${account.publicKey}`);
      console.log(`private key: ${account.privateKey}\n`);
      return account;
    }
    const assetAccount = generateAccount('Asset account');

    const sendCurrencyTx = (dist: Address) => {
      const tx = TransferTransaction.create(
        Deadline.create(),
        dist,
        [NetworkCurrencyMosaic.createRelative(10)],
        EmptyMessage,
        getNetworkType()
      );
      return tx;
    }

    const convertIntoMultisigTx = MultisigAccountModificationTransaction.create(
      Deadline.create(),
      1,
      1,
      [
        new MultisigCosignatoryModification(CosignatoryModificationAction.Add, masterAccount.publicAccount)
      ],
      getNetworkType()
    );

    const sendCurrencyToMultisigAccount = sendCurrencyTx(assetAccount.address);

    const aggregateTx = AggregateTransaction.createComplete(
      Deadline.create(),
      [
        // sendCurrencyToMultisigAccount.toAggregate(masterAccount.publicAccount),
        convertIntoMultisigTx.toAggregate(assetAccount.publicAccount)
      ],
      getNetworkType(),
      []
    );

    const confirmed: Transaction = await new Promise((resolve, reject) => {
      try {
        listenerUtil({
          address: assetAccount.address,
          hooks: {
            onOpen: () => {
              const signedTx: SignedTransaction = masterAccount.signTransactionWithCosignatories(
                aggregateTx,
                [assetAccount],
                GENERATION_HASH,
              );
              console.log(`txHash: ${signedTx.hash}`);
              txHttp.announce(signedTx);
            },
            onStatus: err => {
              reject(new Error(err.status));
            },
            onConfirmed: info => {
              resolve(info);
            },
          },
        });
      } catch (err) {
        reject(err);
      }
    });
  }


  // ******************************************************
  // 3. Send asset mosaic
  // ******************************************************
  export const sendAssetMosaic = async (address: string, mosaicId: string) => {
    const masterAccount = Account.createFromPrivateKey(MASTER_PRIVATE_KEY, getNetworkType());
    const recipientAddress = Address.createFromRawAddress(address);
    const transferTx = TransferTransaction.create(
      Deadline.create(),
      recipientAddress,
      [new Mosaic( new MosaicId(mosaicId), UInt64.fromUint(1))],
      EmptyMessage,
      getNetworkType()
    );

    const confirmed: Transaction = await new Promise((resolve, reject) => {
      try {
        listenerUtil({
          address: masterAccount.address,
          hooks: {
            onOpen: () => {
              const signedTx: SignedTransaction = masterAccount.sign(
                transferTx,
                GENERATION_HASH,
              );
              console.log(`txHash: ${signedTx.hash}`);
              txHttp.announce(signedTx);
            },
            onStatus: err => {
              reject(new Error(err.status));
            },
            onConfirmed: info => {
              resolve(info);
            },
          },
        });
      } catch (err) {
        reject(err);
      }
    });
  }


  // ******************************************************
  // 5. Modify asset multisig account owner
  // ******************************************************
  export const assetOwnerModification = (assetPrivateKey: string, currentOwnerPrivateKey: string, newOwnerPrivateKey: string) => {
    // Accounts
    const assetAccount = Account.createFromPrivateKey(assetPrivateKey, getNetworkType());
    const currentOwnerAccount = Account.createFromPrivateKey(currentOwnerPrivateKey, getNetworkType());
    const newOwnerAccount = Account.createFromPrivateKey(newOwnerPrivateKey, getNetworkType());

    // Modify owner
    const modifyMultisigTx = MultisigAccountModificationTransaction.create(
      Deadline.create(),
      0,
      0,
      [
        new MultisigCosignatoryModification(CosignatoryModificationAction.Add, newOwnerAccount.publicAccount),
        new MultisigCosignatoryModification(CosignatoryModificationAction.Remove, currentOwnerAccount.publicAccount)
      ],
      getNetworkType()
    );

    const aggregateTx = AggregateTransaction.createBonded(
      Deadline.create(),
      [
        modifyMultisigTx.toAggregate(assetAccount.publicAccount)
      ],
      getNetworkType(),
      []
    );

    const signedTx = currentOwnerAccount.sign(aggregateTx, GENERATION_HASH);
    console.log(signedTx.hash);

    const hashLockTx = HashLockTransaction.create(
      Deadline.create(),
      NetworkCurrencyMosaic.createRelative(10),
      UInt64.fromUint(480),
      signedTx,
      getNetworkType()
    );

    const aggregateLockTx = AggregateTransaction.createComplete(
      Deadline.create(),
      [
        hashLockTx.toAggregate(assetAccount.publicAccount)
      ],
      getNetworkType(),
      []
    );

    const lockSignedTx = currentOwnerAccount.sign(aggregateLockTx, GENERATION_HASH);

    txHttp
      .announce(lockSignedTx)
      .subscribe(x => {
          console.log("Locked!!");
      }, err => console.error(err));

    //ロックが承認されたらトランザクションを投げる
    const listener = new Listener(CATAPULT_URL);
    listener
      .confirmed(assetAccount.address)
      .pipe(
          filter((tx:Transaction) => tx.transactionInfo !== undefined && tx.transactionInfo.hash === lockSignedTx.hash),
          mergeMap(ignored => txHttp.announceAggregateBonded(signedTx))
      )
      .subscribe(_ => {
              console.log("announce bond");
          },
          err => console.error(err)
      );

    listener
      .aggregateBondedAdded(assetAccount.address)
      .pipe(
        filter(_ => !_.signedByAccount(newOwnerAccount.publicAccount)),
        map(_ => newOwnerAccount.signCosignatureTransaction(CosignatureTransaction.create(_))),
        mergeMap(_ => txHttp.announceAggregateBondedCosignature(_))
      )
      .subscribe(_ =>{
        console.log(">>Carol cosign in Alice partial transaction<<");
        listener
        .confirmed(assetAccount.address)
        .pipe(
            filter((tx) => tx.transactionInfo !== undefined && tx.transactionInfo.hash === signedTx.hash),
        )
        .subscribe(_ => {
          console.log(_);
        })}, err => console.error(err));
  }