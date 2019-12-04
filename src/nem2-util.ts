import { 
  Account, 
  Address,
  AggregateTransaction,
  AliasAction,
  AliasTransaction,
  Deadline, 
  MosaicAliasTransaction,
  MosaicDefinitionTransaction,
  MosaicFlags,
  MosaicNonce,
  MosaicId,
  MosaicSupplyChangeAction,
  MosaicSupplyChangeTransaction,
  NamespaceId,
  NamespaceRegistrationTransaction,
  NetworkType,
  SignedTransaction,
  TransactionHttp, 
  UInt64,
  } from 'nem2-sdk';
  require('dotenv').config({path: __dirname + '/../.env'});
  const getNetworkType = () => {
    return NetworkType.MIJIN_TEST;
  };
  const { GENERATION_HASH, CATAPULT_URL, MASTER_PRIVATE_KEY } = process.env;

  // ******************************************************
  // Get Namespaces
  // ******************************************************
  export const registerNamespaces = (rootName: string, duration: number, subName01?: string, subName02?: string) => {
    const txHttp = new TransactionHttp(CATAPULT_URL);
    const name = {
      rootName: rootName,
      subName01: subName01,
      subName02: subName02
    };
    console.log(MASTER_PRIVATE_KEY);
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


  // ******************************************************
  // Get Namespace & Mosaic
  // ******************************************************
  export const registerNsMosaic = (rootName: string, duration: number, ammount: number, subName01?: string, subName02?: string) => {
    const txHttp = new TransactionHttp(CATAPULT_URL);
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