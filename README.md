# Monetha: Decentralized disputes SDK example <!-- omit in toc -->

SDK is in https://github.com/monetha/claims-js-sdk

This example demonstrates usage of Monetha's decentalized dispute management SDK (claims-sdk). Example is preconfigured to use Monetha's token and Monetha's claims handler contracts on Ethereum Ropsten network.

Contract addresses are as follows:
- Monetha claims handler contract: `0xCC0Ebb3086C6418f77Ba10575023dd613E08268b`
- Monetha token contract: `0x46917fcca9dfe441675535fc422dcd6c1b2824f9`

If you have deployed your own claims handler contract - you can modify address in `src/constants/constants.ts`

## Running an example

### Prerequisites

1. Node.js 8+ version
1. Chrome with Metamask extension
1. There must be two wallets selectable in Metamask on Ethereum Ropsten network. Each wallet must have at least 150 MTH tokens and some ETH for transaction fees

### Running

Install dependencies
```
npm install
```

Start application
```
npm start
```

Application is now started on http://localhost:3000. Open it using Chrome browser.

### Usage

Application page contains explanation blocks which will guide you through the process of creating and closing the dispute.

## Code

To see how `claims-sdk` is used in code, take a look at file `src/components/App/index.tsx`. There you can see how to call `ClaimManager` in SDK and how to execute transactions.