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


  const { GENERATION_HASH, CATAPULT_URL, MASTER_PRIVATE_KEY } = process.env;
  const getNetworkType = () => {
    return NetworkType.MIJIN_TEST;
  };

    // *******************************************************************************
    //  --- Link Collection ---
    // NEM Developer Center（https://nemtech.github.io/）
    // nem2-sdk Document（https://nemtech.github.io/nem2-sdk-typescript-javascript/）
    // Rest API Document（https://nemtech.github.io/endpoints.html）
    // NEM Foundation Catapult Testnet（http://docs.nem.io/en/testnet）
    // *******************************************************************************

    const accounts = {
      alice: {
        address: 'SCFVR6NITKKU42ZKRCDNLSKMS2IOJ65IRCZ3ZSH7',
        publicKey: 'B07FDBDC9FBAC698E0087A24A620993E0748F5257CCF32FBBC439C4B979AE834',
        privateKey: '63A1E7668227729918825E838068DC9945FA1D30A4F193EA472D121B7F071542'
      },
      bob: {
        address: 'SCALC22CBHNAFR2FZMF2UCX4HKBMYLJSILJRBWTR',
        publicKey: '95128169E7ACB8BB3804E20901E42D94EE1673F6D310015E64BD0BBDCB4C3D1A',
        privateKey: '2556946C9D0041E23D1D23F3272CC613B599420B707E6DFCB2DCC8569AF81169'
      }
    }


    // ******************************************************
    // Create & Send Account Metadata
    // ******************************************************
    const sendMetadataTx = () => {
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
      const newValueData = 'newValue';
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
    // sendMetadataTx();



    // ******************************************************
    // Get Namespace & Sub Namespace
    // ******************************************************
    const registerNamespaces = () => {
      const txHttp = new TransactionHttp(CATAPULT_URL);
      const name = {
        rootName: 'sample',
        subName: 'hoge'
      };
      const namespaceId = new NamespaceId(name.rootName + '.' + name.subName); 
      const ownerAccount: Account = Account.createFromPrivateKey(GENERATION_HASH, NetworkType.MIJIN_TEST);
      const linkingAddress: Address = Address.createFromRawAddress(
        ownerAccount.address.plain(),
      );
      const registerRootNsTx = NamespaceRegistrationTransaction.createRootNamespace(
        Deadline.create(),
        name.rootName,
        UInt64.fromUint(1000),
        getNetworkType(),
      );
      const registerSubRootNsTx = NamespaceRegistrationTransaction.createSubNamespace(
        Deadline.create(),
        name.subName,
        name.rootName,
        getNetworkType(),
      );
      const addressAliasTx: AliasTransaction = AliasTransaction.createForAddress(
        Deadline.create(),
        AliasAction.Link,
        namespaceId,
        linkingAddress,
        getNetworkType()
      );
      const aggregateTx: AggregateTransaction = AggregateTransaction.createComplete(
        Deadline.create(),
        [
          registerRootNsTx.toAggregate(ownerAccount.publicAccount),
          registerSubRootNsTx.toAggregate(ownerAccount.publicAccount),
          addressAliasTx.toAggregate(ownerAccount.publicAccount)
        ],
        getNetworkType(),
        [],
      );
      const signedTx: SignedTransaction = ownerAccount.sign(aggregateTx, GENERATION_HASH);
  
      txHttp
        .announce(signedTx)
        .subscribe(() => {
          console.log('[Transaction announced]');
          console.log('Endpoint: %s/transaction/%s', CATAPULT_URL, signedTx.hash);
          console.log('Namespace Id:', namespaceId);
        },err => {
          console.error('txHttp error:', err);
        });
    }
    // registerNamespaces();