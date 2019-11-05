import { 
  Account, 
  Address,
  AccountMetadataTransaction,
  AggregateTransaction,
  AliasAction,
  AliasTransaction,
  CosignatureTransaction,
  CosignatureSignedTransaction,
  Deadline, 
  KeyGenerator,
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
  NetworkCurrencyMosaic,
  PlainMessage,
  SignedTransaction,
  TransactionHttp,
  TransferTransaction, 
  TransactionMapping,
  UInt64,
  } from 'nem2-sdk';
  import { accounts } from './account'
  require('dotenv').config({path: __dirname + '/../.env'});
  const getNetworkType = () => {
    return NetworkType.MIJIN_TEST;
  };
  const { GENERATION_HASH, CATAPULT_URL, MASTER_PRIVATE_KEY } = process.env;

  // *******************************************************************************
  //  --- Link Collection ---
  // NEM Developer Center（https://nemtech.github.io/）
  // nem2-sdk Document（https://nemtech.github.io/nem2-sdk-typescript-javascript/）
  // Rest API Document（https://nemtech.github.io/endpoints.html）
  // NEM Foundation Catapult Testnet（http://docs.nem.io/en/testnet）
  // *******************************************************************************

  // ******************************************************
  // Create & Send Account Metadata
  // ******************************************************
  export const sendMetadataTx = (value: string) => {
    const masterAccount: Account = Account.createFromPrivateKey(
      MASTER_PRIVATE_KEY,
      getNetworkType(),
    );
    const aliceAccount: Account = Account.createFromPrivateKey(
      accounts.alice.privateKey,
      getNetworkType(),
    );
    const bobAccount: Account = Account.createFromPrivateKey(
      accounts.bob.privateKey,
      getNetworkType(),
    );
    const bobAddress: Address = Address.createFromRawAddress(bobAccount.address.plain());

    // pay the fee tx
    const payFeeTx = TransferTransaction.create(
      Deadline.create(),
      bobAddress,
      [NetworkCurrencyMosaic.createRelative(0.5)],
      PlainMessage.create('Payment of fees'),
      getNetworkType(),
    );

    // metadata tx
    const newValueData = value;
    const newValue = newValueData.toString();
    const key = KeyGenerator.generateUInt64Key('AGREE');
    const accountMetadataTx: AccountMetadataTransaction = AccountMetadataTransaction.create(
      Deadline.create(),
      aliceAccount.publicKey,
      key,
      newValue.length,
      newValue,
      getNetworkType(),
    );

    const aggregateTx: any = AggregateTransaction.createComplete(
      Deadline.create(),
      [
        payFeeTx.toAggregate(masterAccount.publicAccount),
        accountMetadataTx.toAggregate(bobAccount.publicAccount)
      ],
      getNetworkType(),
      [],
      UInt64.fromUint(100000)
    );

    const masterSignedTx = aggregateTx.signWith(masterAccount, GENERATION_HASH);
    const bobSignedTx = CosignatureTransaction.signTransactionPayload(bobAccount, masterSignedTx.payload, GENERATION_HASH);
    const aliceSignedTx = CosignatureTransaction.signTransactionPayload(aliceAccount, masterSignedTx.payload, GENERATION_HASH);

    const cosignSignedTxs = [
      new CosignatureSignedTransaction(
        masterSignedTx.hash,
        bobSignedTx.signature,
        bobSignedTx.signerPublicKey
      ),
      new CosignatureSignedTransaction(
        masterSignedTx.hash,
        aliceSignedTx.signature,
        aliceSignedTx.signerPublicKey
      )
    ];

    const recreatedTx: any = TransactionMapping.createFromPayload(masterSignedTx.payload);
    const signedTx = recreatedTx.signTransactionGivenSignatures(masterAccount, cosignSignedTxs, GENERATION_HASH);
      
    const txHttp = new TransactionHttp(CATAPULT_URL);
    txHttp
      .announce(signedTx)
      .subscribe(() => {
        console.log(signedTx.hash);
      },
      err => console.log(err));
  }


  // ******************************************************
  // Get Namespace & Sub Namespace
  // ******************************************************
  export const registerNamespaces = (rootName: string, subName01?: string, subName02?: string) => {
    const txHttp = new TransactionHttp(CATAPULT_URL);
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
      UInt64.fromUint(1000),
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
  export const registerNsMosaic = (rootName: string, subName01?: string, subName02?: string) => {
    const txHttp = new TransactionHttp(CATAPULT_URL);
    const name = {
      rootName: rootName,
      subName01: subName01,
      subName02: subName02.toLowerCase()
    };    
    let namespaceId: NamespaceId;
    const ownerAccount: Account = Account.createFromPrivateKey(MASTER_PRIVATE_KEY, getNetworkType());
    const registerRootNsTx = NamespaceRegistrationTransaction.createRootNamespace(
      Deadline.create(),
      name.rootName,
      UInt64.fromUint(1000),
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
      UInt64.fromUint(100),
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