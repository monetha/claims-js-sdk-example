import { convertCallbackToPromise } from './promise';
import { ethNetworkUrl } from 'src/constants/constants';
import { IRawTX } from './metamask';
import { ITransactionReceipt } from 'claims-sdk/dist/models/tx';
import Web3 from 'web3';
import {ITransactionObject} from "claims-sdk";

export enum BlockStatuses {
  Failed = '0x0',
  Passed = '0x1',
}

let web3 = null;

export function getWeb3(): Web3 {
  if (web3) {
    return web3;
  }

  web3 = new Web3(new Web3.providers.HttpProvider(ethNetworkUrl));

  return web3;
}

/**
 * waitForTxToFinish waits for transaction to finish for the given txHash,
 * returns a promise which is resolved when transaction finishes.
 * @param {string} txHash a string with transaction hash as value
 */
export const waitForTxToFinish = (txHash: string): Promise<ITransactionReceipt> =>
  new Promise((resolve, reject) => {

    const waiter = async () => {
      try {
        let result = await getTransactionReceipt(txHash);

        if (result) {
          if (result.status === BlockStatuses.Failed) {
            console.error(result);
            throw new Error('Transaction has failed');
          }

          resolve(result);
          return;
        }
      }
      catch (err) {
        reject(err);
        return;
      }

      setTimeout(waiter, 1000);
    }

    waiter();
  });

export const getTransactionReceipt = (txHash: string) => {
  const web3 = getWeb3();

  return convertCallbackToPromise(
    web3.eth.getTransactionReceipt,
    txHash,
  );
}

/**
 * Prepare transaction metadata for contract method exection transaction submission.
 * This includes gas limit and price estimations and nonce retrieval
 */
export const prepareRawTX = async <T>(fromAddress: string, toAddress: string, tx: ITransactionObject<T>): Promise<IRawTX> => {
  const nonce = await getNonceFromBlockChain(fromAddress);
  const gasPrice = await getGasPriceFromBlockChain();
  const gasLimit = await tx.estimateGas({
    from: fromAddress,
  } as any);

  const web3 = getWeb3();
  return {
    from: fromAddress,
    to: toAddress,
    nonce: web3.utils.toHex(nonce),
    gasPrice,
    gasLimit,
    value: 0,
    data: tx.encodeABI(),
  };
};

export const getGasPriceFromBlockChain = (): Promise<string> => {
  const web3 = getWeb3();

  return web3.eth.getGasPrice();
};

export const getNonceFromBlockChain = (fromAddress: string): Promise<number> => {
  const web3 = getWeb3();

  return web3.eth.getTransactionCount(fromAddress);
}
