import { 
  Address,
  AggregateTransaction,
  CosignatureSignedTransaction,
  Listener,
  NetworkType,
  Transaction,
  TransactionStatusError,
  TransactionHttp
  } from 'nem2-sdk';
  require('dotenv').config({path: __dirname + '/../.env'});
  const { CATAPULT_URL } = process.env;

  export const txHttp = new TransactionHttp(CATAPULT_URL);

  export const getNetworkType = () => {
    return NetworkType.TEST_NET;
  };

  export const listenerUtil = ({
    address,
    hooks = {},
  }: {
    address: Address;
    hooks?: {
      onOpen?: (listner: Listener) => void;
      onStatus?: (err: TransactionStatusError) => void;
      onUnconfirmed?: (tx: Transaction) => void;
      onConfirmed?: (tx: Transaction) => void;
      onAggregateBondedAdded?: (tx: AggregateTransaction) => void;
      onCosignatureAdded?: (tx: CosignatureSignedTransaction) => void;
    };
  }) => {
    const listener = new Listener(CATAPULT_URL);
  
    const nextObserver = (_: any, hook: any) => (info: any) => {
      listener.close();
      typeof hook === 'function' && hook(info, listener);
    };
    const errorObserver = (err :any) => {
      console.error('ListenerUtil error');
      console.error(err);
      listener.close();
      throw err;
    };
  
    listener.open().then(() => {
      hooks.onOpen && hooks.onOpen(listener);
      // Note: status = tx error
      if (hooks.onStatus) {
        listener.status(address).subscribe({
          next: nextObserver('STATUS', hooks.onStatus),
          error: errorObserver,
        });
      }
      if (hooks.onUnconfirmed) {
        listener.unconfirmedAdded(address).subscribe({
          next: nextObserver('UNCONFIRMED', hooks.onUnconfirmed),
          error: errorObserver,
        });
      }
      if (hooks.onConfirmed) {
        listener.confirmed(address).subscribe({
          next: nextObserver('CONFIRMED', hooks.onConfirmed),
          error: errorObserver,
        });
      }
      if (hooks.onAggregateBondedAdded) {
        listener.aggregateBondedAdded(address).subscribe({
          next: nextObserver(
            'AGGREGATE_BONDED_ADDED',
            hooks.onAggregateBondedAdded,
          ),
          error: errorObserver,
        });
      }
      if (hooks.onCosignatureAdded) {
        listener.cosignatureAdded(address).subscribe({
          next: nextObserver('COSIGNATURE_ADDED', hooks.onCosignatureAdded),
          error: errorObserver,
        });
      }
    });
    return listener;
  };
