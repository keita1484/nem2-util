import { 
  Account, 
  Address,
  AggregateTransaction,
  AliasAction,
  AliasTransaction,
  CosignatureSignedTransaction,
  CosignatureTransaction,
  Deadline, 
  EmptyMessage,
  HashLockTransaction,
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
  NetworkCurrencyMosaic,
  PlainMessage,
  SignedTransaction,
  Transaction,
  TransactionMapping,
  TransferTransaction,
  Listener,
  UInt64,
  MultisigCosignatoryModification,
  CosignatoryModificationAction,
  } from 'nem2-sdk';
  import {filter, map, mergeMap, max} from "rxjs/operators";
  import {merge} from "rxjs";
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


  export const transferTx = async () => {
    const recipientAddress = Address.createFromRawAddress('TC56N3TVMZN5XOK3BPOPG7FLBXPBPCD7CAJ6HA7V');

    const transferTransaction = TransferTransaction.create(
      Deadline.create(),
      recipientAddress,
      [NetworkCurrencyMosaic.createRelative(100)],
      PlainMessage.create('This is a test message'),
      getNetworkType(),
      UInt64.fromUint(1000000));
    /* end block 01 */

    /* start block 02 */
    const privateKey = 'CC2907C8DD2AF35DC686B1D625F4E3347094E50FCCC66AEA54763AD861E82C2E';
    const account = Account.createFromPrivateKey(privateKey, getNetworkType());
    const networkGenerationHash = '8B9D9872BA89A93C6A28AE0EA11A765E04CD956EC2C5A125E3A779ACE883FE46';
    const signedTx = account.sign(transferTransaction, networkGenerationHash);
    /* end block 02 */

    txHttp
      .announce(signedTx)
      .subscribe(() => {
        console.log('[Transaction announced]');
        console.log('Endpoint: %s/transaction/%s', CATAPULT_URL, signedTx.hash);
      },err => {
        console.error('txHttp error:', err);
      });
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
      UInt64.fromUint(1000000)
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
      UInt64.fromUint(1000000)
    );
    const mosaicChangeTx: MosaicSupplyChangeTransaction = MosaicSupplyChangeTransaction.create(
      Deadline.create(),
      mosaicDefTx.mosaicId,
      MosaicSupplyChangeAction.Increase,
      UInt64.fromUint(ammount),
      getNetworkType(),
      UInt64.fromUint(1000000)
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
        UInt64.fromUint(1000000)
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
        UInt64.fromUint(1000000)
      );

    } else if (name.subName01 !== undefined && name.subName02 === undefined){
      namespaceId = new NamespaceId(name.rootName + '.' + name.subName01); 
      registerSubRootNs01Tx = NamespaceRegistrationTransaction.createSubNamespace(
        Deadline.create(),
        name.subName01,
        name.rootName,
        getNetworkType(),
        UInt64.fromUint(1000000)
      );
      moisacAliasTx = MosaicAliasTransaction.create(
        Deadline.create(),
        AliasAction.Link,
        namespaceId,
        mosaicId,
        getNetworkType(),
        UInt64.fromUint(1000000)
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
        UInt64.fromUint(1000000));

    } else {
      namespaceId = new NamespaceId(name.rootName + '.' + name.subName01  + '.' + name.subName02); 
      registerSubRootNs01Tx = NamespaceRegistrationTransaction.createSubNamespace(
        Deadline.create(),
        name.subName01,
        name.rootName,
        getNetworkType(),
        UInt64.fromUint(1000000)
      );
      registerSubRootNs02Tx = NamespaceRegistrationTransaction.createSubNamespace(
        Deadline.create(),
        name.subName02,
        name.rootName + '.' + name.subName01,
        getNetworkType(),
        UInt64.fromUint(1000000)
      );
      moisacAliasTx = MosaicAliasTransaction.create(
        Deadline.create(),
        AliasAction.Link,
        namespaceId,
        mosaicId,
        getNetworkType(),
        UInt64.fromUint(1000000)
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
        UInt64.fromUint(1000000)
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
  export const convertAssetAccount = () => {
    const listener = new Listener(CATAPULT_URL);

    const generateAccount = (tag: string) => {
      const account = Account.generateNewAccount(getNetworkType());
      console.log(`--- account info ${tag} ---`);
      console.log(`address: ${account.address.plain()}`);
      console.log(`public key: ${account.publicKey}`);
      console.log(`private key: ${account.privateKey}\n`);
      return account;
    }

    const masterAccount = Account.createFromPrivateKey(MASTER_PRIVATE_KEY, getNetworkType());
    const multisigAccount = generateAccount('multisig account');

    const emptyTransaction = TransferTransaction.create(
      Deadline.create(),
      multisigAccount.address,
      [],
      EmptyMessage,
      getNetworkType(),
    );

    const convertIntoMultisigTx = MultisigAccountModificationTransaction.create(
      Deadline.create(),
      1,
      1,
      [
        masterAccount.publicAccount,
      ],
      [],
      getNetworkType(),
    );

    const aggregateTx = AggregateTransaction.createComplete(
      Deadline.create(),
      [
        emptyTransaction.toAggregate(masterAccount.publicAccount),
        convertIntoMultisigTx.toAggregate(multisigAccount.publicAccount),
      ],
      getNetworkType(),
      [],
      UInt64.fromUint(107000),
    );

    const signedTx = masterAccount.signTransactionWithCosignatories(
      aggregateTx,
      [multisigAccount],
      GENERATION_HASH
    );

    console.log(`txHash: ${signedTx.hash}`);

    listener.open().then(() => {
      listener.status(masterAccount.address)
      .pipe(filter(error => error.hash === signedTx.hash))
      .subscribe(err => {
        console.error(err);
        listener.close();
      },
      err => {
        console.error(err);
      });
      listener.unconfirmedAdded(masterAccount.address)
      .pipe(
        filter(transaction => (transaction.transactionInfo !== undefined)
        && transaction.transactionInfo.hash === signedTx.hash)
      ).subscribe(ignored => {
        console.log('transaction status changed unconfirmed');
        listener.close();
      });

      txHttp.announce(signedTx).subscribe(x => {
        console.log(x);
      }, err => {
        console.error(err);
      })
    });
  };



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
      getNetworkType(),
      UInt64.fromUint(1000000));

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
      [ newOwnerAccount.publicAccount ],
      [ currentOwnerAccount.publicAccount ],
      getNetworkType(),
      UInt64.fromUint(1000000));

    const aggregateTx = AggregateTransaction.createBonded(
      Deadline.create(),
      [
        modifyMultisigTx.toAggregate(assetAccount.publicAccount)
      ],
      getNetworkType(),
      [],
      UInt64.fromUint(1000000));

    const signedTx = currentOwnerAccount.sign(aggregateTx, GENERATION_HASH);

    const hashLockTx = HashLockTransaction.create(
      Deadline.create(),
      NetworkCurrencyMosaic.createRelative(10),
      UInt64.fromUint(480),
      signedTx,
      getNetworkType(),
      UInt64.fromUint(1000000)
    );

    const aggregateLockTx = AggregateTransaction.createComplete(
      Deadline.create(),
      [
        hashLockTx.toAggregate(assetAccount.publicAccount)
      ],
      getNetworkType(),
      [],
      UInt64.fromUint(1000000)
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
      }, err => console.error(err));

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