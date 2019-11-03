import { 
  Account, 
  Address,
  AccountMetadataTransaction,
  AliasAction,
  AliasTransaction,
  NetworkCurrencyMosaic, 
  Deadline, 
  TransferTransaction, 
  NetworkType,
  PlainMessage,
  KeyGenerator,
  AggregateTransaction,
  TransactionHttp,
  SignedTransaction,
  NamespaceId,
  NamespaceRegistrationTransaction,
  CosignatureTransaction,
  CosignatureSignedTransaction,
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
  export const registerNamespaces = (rootName: string, subName?: string) => {
    const txHttp = new TransactionHttp(CATAPULT_URL);
    const name = {
      rootName: rootName,
      subName: subName
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
    let registerSubRootNsTx: NamespaceRegistrationTransaction;
    let addressAliasTx: AliasTransaction;

    if(name.subName === undefined) {
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

    } else {
      namespaceId = new NamespaceId(name.rootName + '.' + name.subName); 
      registerSubRootNsTx = NamespaceRegistrationTransaction.createSubNamespace(
        Deadline.create(),
        name.subName,
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
          registerSubRootNsTx.toAggregate(ownerAccount.publicAccount),
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