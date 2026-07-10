import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Button from "../ui/Button";
import Icon from "../ui/Icon";
import { useAuth } from "../../auth/AuthContext";
import { getWalletStatus, retryRoleAssignment } from "../../api/walletApi";
import { connectAndLinkWallet } from "../../blockchain/walletLink";

function shortAddress(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/**
 * Shows nothing once the wallet is linked AND has the right on-chain role.
 * Otherwise nudges the user to connect MetaMask (or retry role assignment
 * if linking succeeded but the on-chain assignRole call failed).
 */
export default function WalletConnectBanner() {
  const { user } = useAuth();
  const [status, setStatus] = useState(null); // { walletAddress, linked, onChainRole, offChainRole }
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const roleToOrdinal = { FARMER: 1, COOPERATIVE: 2, TRANSPORTER: 3, CONSUMER: 4 };

  const refresh = async () => {
    try {
      const data = await getWalletStatus();
      setStatus(data);
    } catch {
      // profile/wallet status is non-critical — fail silently, banner just won't show
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  if (!user || dismissed || !status) return null;

  const expectedOnChain = roleToOrdinal[user.role];
  const roleMatches = Number(status.onChainRole) === expectedOnChain;

  if (status.linked && roleMatches) return null;

  const handleConnect = async () => {
    setBusy(true);
    try {
      const result = await connectAndLinkWallet(user.email);
      if (result.roleAssignedOnChain) {
        toast.success("Wallet connected and role assigned on-chain!");
      } else {
        toast.error(result.warning || "Wallet linked, but role assignment failed — try again.");
      }
      await refresh();
    } catch (err) {
      toast.error(err.message || "Could not connect wallet");
    } finally {
      setBusy(false);
    }
  };

  const handleRetryRole = async () => {
    setBusy(true);
    try {
      await retryRoleAssignment();
      toast.success("Role assigned on-chain!");
      await refresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Retry failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="bg-role-accent/10 border border-role-accent/30 rounded-2xl p-4 flex items-center gap-4 flex-wrap justify-between">
      <div className="flex items-center gap-3">
        <Icon name="account_balance_wallet" className="text-2xl text-role-accent" />
        <div>
          <p className="text-sm font-bold text-on-surface">
            {!status.linked
              ? "Connect your MetaMask wallet"
              : `Wallet ${shortAddress(status.walletAddress)} needs its on-chain role assigned`}
          </p>
          <p className="text-xs text-on-surface-variant">
            {!status.linked
              ? "Blockchain actions (create, certify, transit, deliver) are signed by your own wallet — link it to act as a " +
                user.role.toLowerCase() +
                "."
              : "This can happen if the first assignment failed. Retry it, or contact an admin."}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="accent"
          icon="link"
          loading={busy}
          onClick={status.linked ? handleRetryRole : handleConnect}
          className="!py-2 !px-4 text-xs"
        >
          {status.linked ? "Retry role assignment" : "Connect MetaMask"}
        </Button>
        <button
          onClick={() => setDismissed(true)}
          className="text-on-surface-variant hover:text-error"
          aria-label="Dismiss"
        >
          <Icon name="close" size="18px" />
        </button>
      </div>
    </section>
  );
}
