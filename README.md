# Monetha: Dispute resolution SDK example

This example demonstrates usage of [Monetha's dispute resolution SDK (claims-sdk)](https://github.com/monetha/claims-js-sdk). Example is preconfigured to use Monetha's token and Monetha's claims handler contracts on Ethereum Ropsten network.

Contract addresses are as follows:
- Monetha claims handler contract: `0xCC0Ebb3086C6418f77Ba10575023dd613E08268b`
- Monetha token contract: `0x46917fcca9dfe441675535fc422dcd6c1b2824f9`

In order to better understand the use cases of the `claims-sdk` please refer to [Monetha Payment layer: Dispute resolution](https://github.com/monetha/payment-layer#dispute-resolution).

## Running an example

### Prerequisites

1. Node.js 8+ version
1. Chrome with Metamask extension
1. There must be two wallets selectable in Metamask on Ethereum Ropsten network (for requester and respondent). Each wallet must have at least 150 MTH tokens and some ETH for transaction fees

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

## Usage

Application page contains explanation blocks which will guide you through the process of resolving a dispute.

### Code

To see how `claims-sdk` is used in code, take a look at file `src/components/App/index.tsx`. There you can see how to call `ClaimManager` in SDK and how to execute transactions.