import { requestAccount, getSigner, describeWalletError } from "./contract";
import { linkWallet } from "../api/walletApi";

// Must match the backend's WalletService#MESSAGE_PATTERN exactly:
// it looks for "Email: <email>\nTimestamp: <epochMillis>" anywhere in the
// signed text, and rejects it if the email doesn't match the logged-in
// account or the timestamp is more than 10 minutes old.
function buildSigningMessage(email) {
  return (
    `Link this wallet to your Jumla Apple SCM account\n` +
    `Email: ${email}\n` +
    `Timestamp: ${Date.now()}`
  );
}

/**
 * Full connect-and-link flow:
 *  1. Ask MetaMask for an account.
 *  2. Have the user sign a message proving they control it.
 *  3. Send it to the backend, which verifies the signature and
 *     auto-assigns the matching on-chain role to that wallet.
 */
export async function connectAndLinkWallet(email) {
  try {
    const address = await requestAccount();
    const signer = await getSigner();
    const message = buildSigningMessage(email);
    const signature = await signer.signMessage(message);

    return await linkWallet({ walletAddress: address, message, signature });
  } catch (err) {
    throw new Error(err?.response?.data?.message || describeWalletError(err));
  }
}
