import toast from "react-hot-toast";
import { getContractWithSigner, describeWalletError } from "./contract";

// Every function here: (1) sends a transaction signed by the user's own
// MetaMask wallet, (2) waits for it to be mined, (3) returns the tx hash so
// the caller can hand it to the backend for verification + persistence.
// Any revert (including the contract's "Wrong role" check) throws with a
// human-readable message via describeWalletError.

async function sendAndWait(contractCallPromise) {
  const toastId = toast.loading("Waiting for MetaMask confirmation…");
  try {
    const tx = await contractCallPromise;
    toast.loading("Transaction submitted — confirming on the blockchain…", { id: toastId });
    const receipt = await tx.wait();
    if (receipt.status !== 1) {
      throw new Error("Transaction reverted on-chain");
    }
    toast.dismiss(toastId);
    return receipt.hash;
  } catch (err) {
    toast.dismiss(toastId);
    throw new Error(describeWalletError(err));
  }
}

export async function createBatchOnChain({
  batchId,
  farmerName,
  farmLocation,
  appleVariety,
  weightKg,
  harvestEpochSeconds,
  ipfsHash = "",
  aiResult = "PENDING",
}) {
  const contract = await getContractWithSigner();
  return sendAndWait(
    contract.createBatch(
      batchId,
      farmerName,
      farmLocation,
      appleVariety,
      BigInt(weightKg),
      BigInt(harvestEpochSeconds),
      ipfsHash,
      aiResult,
    ),
  );
}

export async function certifyBatchOnChain(batchId) {
  const contract = await getContractWithSigner();
  return sendAndWait(contract.certifyBatch(batchId));
}

export async function updateTransitOnChain(batchId, location, destination = "") {
  const contract = await getContractWithSigner();
  return sendAndWait(contract.updateTransit(batchId, location, destination));
}

export async function deliverBatchOnChain(batchId) {
  const contract = await getContractWithSigner();
  return sendAndWait(contract.deliverBatch(batchId));
}

export async function updateIpfsHashOnChain(batchId, ipfsHash) {
  const contract = await getContractWithSigner();
  return sendAndWait(contract.updateIPFSHash(batchId, ipfsHash));
}
