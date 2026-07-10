// ABI for AppleBatch.sol — hand-written to match the deployed contract
// source exactly (function signatures, event args, and struct return order).
// Keep this in sync with the .sol file / backend's generated Java wrapper
// if the contract is ever redeployed with changes.
export const APPLE_BATCH_ABI = [
  {
    type: "function",
    name: "assignRole",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_user", type: "address" },
      { name: "_role", type: "uint8" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "myRole",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
  {
    type: "function",
    name: "roles",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ type: "uint8" }],
  },
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "createBatch",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_batchId", type: "string" },
      { name: "_farmerName", type: "string" },
      { name: "_farmLocation", type: "string" },
      { name: "_appleVariety", type: "string" },
      { name: "_weightKg", type: "uint256" },
      { name: "_harvestDate", type: "uint256" },
      { name: "_ipfsHash", type: "string" },
      { name: "_aiResult", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "certifyBatch",
    stateMutability: "nonpayable",
    inputs: [{ name: "_batchId", type: "string" }],
    outputs: [],
  },
  {
    type: "function",
    name: "updateTransit",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_batchId", type: "string" },
      { name: "_location", type: "string" },
      { name: "_destination", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "deliverBatch",
    stateMutability: "nonpayable",
    inputs: [{ name: "_batchId", type: "string" }],
    outputs: [],
  },
  {
    type: "function",
    name: "updateIPFSHash",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_batchId", type: "string" },
      { name: "_ipfsHash", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "getBatch",
    stateMutability: "view",
    inputs: [{ name: "_batchId", type: "string" }],
    outputs: [
      { type: "string" }, // batchId
      { type: "string" }, // farmerName
      { type: "string" }, // farmLocation
      { type: "string" }, // appleVariety
      { type: "uint256" }, // weightKg
      { type: "uint256" }, // harvestDate
      { type: "uint8" }, // status
      { type: "uint256" }, // certifiedAt
      { type: "string" }, // destination
      { type: "uint256" }, // deliveredAt
      { type: "string" }, // ipfsHash
      { type: "string" }, // aiResult
    ],
  },
  {
    type: "function",
    name: "getTransitHistory",
    stateMutability: "view",
    inputs: [{ name: "_batchId", type: "string" }],
    outputs: [
      { name: "locations", type: "string[]" },
      { name: "timestamps", type: "uint256[]" },
      { name: "updaters", type: "address[]" },
    ],
  },
  {
    type: "function",
    name: "getBatchStatus",
    stateMutability: "view",
    inputs: [{ name: "_batchId", type: "string" }],
    outputs: [{ type: "string" }],
  },
  {
    type: "function",
    name: "getAllBatchIds",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string[]" }],
  },
  {
    type: "function",
    name: "totalBatches",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "batchIdExists",
    stateMutability: "view",
    inputs: [{ name: "_batchId", type: "string" }],
    outputs: [{ type: "bool" }],
  },
  {
    type: "event",
    name: "BatchCreated",
    inputs: [
      { name: "batchId", type: "string", indexed: true },
      { name: "farmer", type: "address", indexed: true },
      { name: "farmerName", type: "string", indexed: false },
    ],
  },
  {
    type: "event",
    name: "BatchCertified",
    inputs: [
      { name: "batchId", type: "string", indexed: true },
      { name: "cooperative", type: "address", indexed: true },
      { name: "certifiedAt", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "TransitUpdated",
    inputs: [
      { name: "batchId", type: "string", indexed: true },
      { name: "transporter", type: "address", indexed: true },
      { name: "location", type: "string", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "BatchDelivered",
    inputs: [
      { name: "batchId", type: "string", indexed: true },
      { name: "transporter", type: "address", indexed: true },
      { name: "destination", type: "string", indexed: false },
      { name: "deliveredAt", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "IPFSHashUpdated",
    inputs: [
      { name: "batchId", type: "string", indexed: true },
      { name: "ipfsHash", type: "string", indexed: false },
    ],
  },
];

// Mirrors the contract's Role enum. Must stay in this exact order.
export const CONTRACT_ROLE = {
  NONE: 0,
  FARMER: 1,
  COOPERATIVE: 2,
  TRANSPORTER: 3,
  CONSUMER: 4,
};

export const CONTRACT_ROLE_NAME = ["NONE", "FARMER", "COOPERATIVE", "TRANSPORTER", "CONSUMER"];
