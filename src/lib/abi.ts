export const COVEIL_MATCHER_ADDRESS =
  "0x8612788836Df0233A36BA93a58826BdD624Ad81f" as const;

export const COVEIL_MATCHER_ABI = [
  // ── writes ──────────────────────────────────────────────────────────────
  {
    name: "createSession",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "partyB", type: "address" }],
    outputs: [],
  },
  {
    name: "submitProfile",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "encryptedData", type: "bytes" }],
    outputs: [],
  },
  {
    name: "computeMatch",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    name: "confirmResult",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "confirmed", type: "bool" }],
    outputs: [],
  },
  // ── views ────────────────────────────────────────────────────────────────
  {
    name: "sessions",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "partyA", type: "address" }],
    outputs: [
      { name: "partyB", type: "address" },
      { name: "partyASubmitted", type: "bool" },
      { name: "partyBSubmitted", type: "bool" },
      { name: "matchComputed", type: "bool" },
    ],
  },
  // ── events ───────────────────────────────────────────────────────────────
  {
    name: "MutualUnlock",
    type: "event",
    inputs: [
      { name: "partyA", type: "address", indexed: true },
      { name: "partyB", type: "address", indexed: true },
    ],
  },
] as const;
