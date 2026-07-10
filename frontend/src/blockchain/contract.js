import { BrowserProvider, Contract } from "ethers";
import { APPLE_BATCH_ABI } from "./abi";

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

// Optional: if set, we'll prompt MetaMask to switch/add this network before
// sending transactions, so users don't accidentally sign against the wrong
// chain (e.g. mainnet instead of your local Hardhat node / testnet).
// Example .env values for a local Hardhat node:
//   VITE_CHAIN_ID_HEX=0x7a69
//   VITE_CHAIN_NAME=Hardhat Local
//   VITE_CHAIN_RPC_URL=http://127.0.0.1:8545
const CHAIN_ID_HEX = import.meta.env.VITE_CHAIN_ID_HEX;
const CHAIN_NAME = import.meta.env.VITE_CHAIN_NAME || "Local Network";
const CHAIN_RPC_URL = import.meta.env.VITE_CHAIN_RPC_URL;

export class WalletError extends Error {}

export function hasMetaMask() {
  return typeof window !== "undefined" && !!window.ethereum;
}

/** Prompts MetaMask's account picker and returns the selected address. */
export async function requestAccount() {
  if (!hasMetaMask()) {
    throw new WalletError("MetaMask is not installed. Please install it from metamask.io.");
  }
  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  if (!accounts?.length) {
    throw new WalletError("No account was authorized in MetaMask.");
  }
  await ensureCorrectNetwork();
  return accounts[0];
}

/** Returns the currently connected account without prompting, or null. */
export async function getConnectedAccount() {
  if (!hasMetaMask()) return null;
  const accounts = await window.ethereum.request({ method: "eth_accounts" });
  return accounts?.[0] || null;
}

async function ensureCorrectNetwork() {
  if (!CHAIN_ID_HEX) return; // no specific network required
  const currentChainId = await window.ethereum.request({ method: "eth_chainId" });
  if (currentChainId?.toLowerCase() === CHAIN_ID_HEX.toLowerCase()) return;

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CHAIN_ID_HEX }],
    });
  } catch (switchError) {
    // 4902 = chain not added to MetaMask yet
    if (switchError?.code === 4902 && CHAIN_RPC_URL) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: CHAIN_ID_HEX,
            chainName: CHAIN_NAME,
            rpcUrls: [CHAIN_RPC_URL],
          },
        ],
      });
    } else {
      throw new WalletError("Please switch MetaMask to the correct network (" + CHAIN_NAME + ").");
    }
  }
}

/** ethers BrowserProvider wrapping window.ethereum. */
export function getProvider() {
  if (!hasMetaMask()) {
    throw new WalletError("MetaMask is not installed. Please install it from metamask.io.");
  }
  return new BrowserProvider(window.ethereum);
}

/** Signer for the currently connected MetaMask account — every batch tx uses this. */
export async function getSigner() {
  const provider = getProvider();
  return provider.getSigner();
}

/** AppleBatch contract instance connected to the user's own signer (sends real txs). */
export async function getContractWithSigner() {
  if (!CONTRACT_ADDRESS) {
    throw new WalletError("VITE_CONTRACT_ADDRESS is not configured in the frontend .env file.");
  }
  const signer = await getSigner();
  return new Contract(CONTRACT_ADDRESS, APPLE_BATCH_ABI, signer);
}

/** Read-only contract instance — no signer needed, used for on-chain lookups. */
export function getReadOnlyContract() {
  if (!CONTRACT_ADDRESS) {
    throw new WalletError("VITE_CONTRACT_ADDRESS is not configured in the frontend .env file.");
  }
  const provider = getProvider();
  return new Contract(CONTRACT_ADDRESS, APPLE_BATCH_ABI, provider);
}

/** Friendlier messages for the most common MetaMask/contract revert cases. */
export function describeWalletError(err) {
  if (err instanceof WalletError) return err.message;
  const raw = err?.reason || err?.shortMessage || err?.message || "Wallet transaction failed";
  if (err?.code === "ACTION_REJECTED" || raw.includes("user rejected")) {
    return "You rejected the transaction in MetaMask.";
  }
  if (raw.includes("Wrong role")) {
    return "Your wallet doesn't have the right on-chain role for this action yet. Connect/link it from your Profile page.";
  }
  return raw;
}
