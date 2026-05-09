export const COVEIL_MATCHER_ABI = [
  {
    "inputs": [{"internalType": "address","name": "partyB","type": "address"}],
    "name": "createSession",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes","name": "encryptedData","type": "bytes"}],
    "name": "submitProfile",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "computeMatch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bool","name": "result","type": "bool"}],
    "name": "confirmResult",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address","name": "partyA","type": "address"}],
    "name": "sessions",
    "outputs": [
      {"internalType": "address","name": "partyA","type": "address"},
      {"internalType": "address","name": "partyB","type": "address"},
      {"internalType": "bool","name": "partyASubmitted","type": "bool"},
      {"internalType": "bool","name": "partyBSubmitted","type": "bool"},
      {"internalType": "bool","name": "matchComputed","type": "bool"},
      {"internalType": "uint256","name": "matchScore","type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true,"internalType": "address","name": "partyA","type": "address"},
      {"indexed": true,"internalType": "address","name": "partyB","type": "address"},
      {"indexed": false,"internalType": "uint256","name": "score","type": "uint256"}
    ],
    "name": "MutualUnlock",
    "type": "event"
  }
] as const

export const COVEIL_MATCHER_ADDRESS = '0x8612788836Df0233A36BA93a58826BdD624Ad81f' as const