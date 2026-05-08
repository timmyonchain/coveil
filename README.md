# Coveil

Blind compatibility matching for DAOs — powered by Zama FHEVM

> "Find your match. Reveal nothing."

🌐 [coveil.vercel.app](https://coveil.vercel.app) · 📄 [Contract on Sepolia](https://sepolia.etherscan.io/address/0x8612788836Df0233A36BA93a58826BdD624Ad81f)

---

## The Problem

DAO treasury negotiations are broken. Before any partnership or investment discussion can begin, both parties must expose sensitive financial details — treasury size, risk appetite, minimum requirements — to a counterparty they don't yet trust. One side always overexposes. Deals collapse before they start.

## The Solution

Coveil is a blind compatibility protocol. Both parties encrypt their financials using Zama's Fully Homomorphic Encryption (FHE) and submit them to a smart contract. The contract computes a compatibility score entirely on encrypted data. If the score reaches 80 or above, both parties are notified via a MutualUnlock event. Neither party ever sees the other's raw numbers — not even the contract does.

---

## How It Works

1. Create a Session
Party A initiates a session by submitting Party B's wallet address on-chain via createSession(address partyB).

2. Submit Encrypted Profiles
Each party independently submits three values — treasury size, minimum partner requirement, and risk score — encrypted client-side using the Zama FHE SDK before they ever touch the blockchain.

3. Compute the Match
computeMatch() runs the compatibility logic entirely on ciphertext. No decryption happens at any point during computation.

4. Confirm the Result
If the match score ≥ 80, the MutualUnlock event is emitted. Both parties call confirmResult(bool) to acknowledge on-chain.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Solidity + Zama FHEVM |
| Encryption | @zama-fhe/sdk v3 |
| Frontend | Next.js 15, React 19, TypeScript |
| Wallet | RainbowKit + wagmi v3 + viem |
| Styling | Tailwind CSS v4 |
| Network | Ethereum Sepolia Testnet |
| Hosting | Vercel |

---

## Contract

- Name: CoveilMatcher
- Network: Sepolia (Chain ID: 11155111)
- Address: 0x8612788836Df0233A36BA93a58826BdD624Ad81f

### ABI Functions

createSession(address partyB)
submitProfile(bytes encryptedData)
computeMatch()
confirmResult(bool result)

### Events

event MutualUnlock(address partyA, address partyB, uint256 score)

---

## Running Locally

git clone https://github.com/timmyonchain/coveil
cd coveil
npm install --legacy-peer-deps

Create .env.local:

NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key

npm run dev

Open [http://localhost:3000](http://localhost:3000)

---

## Privacy Guarantees

- Raw financial values are never transmitted to any server
- Encryption happens entirely in the browser using Zama FHE
- The smart contract operates only on ciphertext
- Only a binary match outcome (score ≥ 80) is ever revealed on-chain

---

## Built For

Zama Bounty Program — FHE x DAO Compatibility Matching

---

*Built by [@timmyonchain](https://github.com/timmyonchain)*
