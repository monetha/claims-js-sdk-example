import { convertCallbackToPromise } from './promise';

export interface IRawTX {
  from: string;
  to: string;
  nonce: string;
  gasPrice: string;
  gasLimit: number;
  value: number;
  data: string;
}

/**
 * Enables metamask usage so it can be used or throws error otherwise
 */
export const enableMetamask = async () => {
  const ethereum = getMetamaskEthereumInstance();

  if (!ethereum) {
    throw new Error('Please install metamask chrome extension');
  }

  if (!ethereum.selectedAddress) {
    throw new Error('Please select an account in metamask');
  }

  try {
    const [currentAddress] = await ethereum.enable();
    if (!currentAddress) {
      throw new Error('Unknown reason');
    }
  } catch (e) {
    console.error(e);

    let msg;
    if (typeof e === 'string') {
      msg = e;
    } else {
      msg = e.message;
    }

    throw new Error('Could not enable metamask: ' + msg);
  }
}

/**
 * Gets current account address selected in metamask
 */
export const getCurrentAccountAddress = () => {
  const ethereum = getMetamaskEthereumInstance();

  if (!ethereum || !ethereum.selectedAddress) {
    return null;
  }

  return ethereum.selectedAddress;
}

/**
 * Submits transaction using metamask and returns its hash
 */
export const sendTransaction = async (rawTx: IRawTX): Promise<string> => {
  const ethereum = getMetamaskEthereumInstance();
  if (!ethereum) {
    throw new Error('Metamask is not enabled');
  }

  return convertCallbackToPromise(
    ethereum.sendAsync,
    {
      method: 'eth_sendTransaction',
      params: [rawTx],
      from: ethereum.selectedAddress,
    }
  ) as Promise<string>;
}

/**
 * Gets current metamask instance
 */
export const getMetamaskEthereumInstance = () => {
  return (window as any).ethereum;
}