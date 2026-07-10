import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { getMyProfile, updateProfile, changePassword } from "../../api/userApi";
import { updateProfilePicture } from "../../api/authApi";
import { getWalletStatus, retryRoleAssignment } from "../../api/walletApi";
import { connectAndLinkWallet } from "../../blockchain/walletLink";
import { updateProfileSchema, changePasswordSchema } from "../../schemas/profileSchemas";
import { useAuth } from "../../auth/AuthContext";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import TopAppBar from "../../components/layout/TopAppBar";
import Icon from "../../components/ui/Icon";

export default function ProfilePage() {
  const { user, updateUserInfo } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profilePicturePath, setProfilePicturePath] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const [walletStatus, setWalletStatus] = useState(null);
  const [walletBusy, setWalletBusy] = useState(false);

  const refreshWalletStatus = () => {
    getWalletStatus()
      .then(setWalletStatus)
      .catch(() => {});
  };

  useEffect(() => {
    refreshWalletStatus();
  }, []);

  const handleConnectWallet = async () => {
    setWalletBusy(true);
    try {
      const result = await connectAndLinkWallet(user.email);
      if (result.roleAssignedOnChain) {
        toast.success("Wallet connected and role assigned on-chain!");
      } else {
        toast.error(result.warning || "Wallet linked, but role assignment failed.");
      }
      refreshWalletStatus();
    } catch (err) {
      toast.error(err.message || "Could not connect wallet");
    } finally {
      setWalletBusy(false);
    }
  };

  const handleRetryRole = async () => {
    setWalletBusy(true);
    try {
      await retryRoleAssignment();
      toast.success("Role assigned on-chain!");
      refreshWalletStatus();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Retry failed");
    } finally {
      setWalletBusy(false);
    }
  };

  const profileForm = useForm({ resolver: zodResolver(updateProfileSchema) });
  const passwordForm = useForm({ resolver: zodResolver(changePasswordSchema) });

  useEffect(() => {
    console.log("getting profile");
    getMyProfile()
      .then(({ data }) => {
        profileForm.reset({
          fullName: data.fullName,
          email: data.email,
          dateOfBirth: data.dateOfBirth || "",
        });
        setProfilePicturePath(data.profilePicturePath || null);
      })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const onSubmitProfile = async (values) => {
    console.log("1st");
    try {
      console.log("uoloading");
      const { data } = await updateProfile(values);
      console.log(data, "data");
      if (data.token) localStorage.setItem("jumla_token", data.token);
      updateUserInfo({ fullName: data.fullName, email: data.email, token: data.token });
      console.log(data, "Updated profile data");
      toast.success("Profile updated.");
    } catch (err) {
      a;
      console.log("failed");
      toast.error(err.response?.data?.message || "Failed to update profile.");
    }
    console.log("end");
  };

  const onSubmitPassword = async (values) => {
    try {
      await changePassword(values);
      toast.success("Password changed.");
      passwordForm.reset();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password.");
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    setPhotoUploading(true);
    try {
      const data = await updateProfilePicture(file);
      console.log("ujploading");
      console.log(data, "data");
      setProfilePicturePath(data.profilePicturePath);
      toast.success("Profile picture updated.");
    } catch (err) {
      console.log("failed");
      toast.error("Failed to upload photo.");
      setPreviewUrl(null);
    } finally {
      setPhotoUploading(false);
    }
  };

  if (loading) return <p className="p-8 text-center text-on-surface-variant">Loading profile…</p>;

  const displayPicture = previewUrl || profilePicturePath;

  return (
    <div className="max-w-xl mx-auto space-y-10 py-8 px-4">
      <TopAppBar title="Edit Profile" />

      {/* ── Profile Picture ── */}
      <section className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-24 h-24 rounded-full bg-surface-container-low border-2 border-dashed border-outline flex items-center justify-center overflow-hidden hover:border-primary transition-colors"
        >
          {displayPicture ? (
            <img src={displayPicture} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <Icon name="person" className="text-4xl text-on-surface-variant" />
          )}
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={photoUploading}
          className="text-sm text-primary font-medium hover:underline disabled:opacity-50"
        >
          {photoUploading ? "Uploading…" : "Change photo"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={handlePhotoChange}
        />
      </section>

      {/* ── Profile Details ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-serif text-primary">Profile Details</h2>
        <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-4">
          <Input
            label="Full Name"
            {...profileForm.register("fullName")}
            error={profileForm.formState.errors.fullName?.message}
          />
          <Input
            label="Email"
            type="email"
            {...profileForm.register("email")}
            error={profileForm.formState.errors.email?.message}
          />
          <Input
            label="Date of Birth"
            type="date"
            {...profileForm.register("dateOfBirth")}
            error={profileForm.formState.errors.dateOfBirth?.message}
          />
          <Button type="submit" loading={profileForm.formState.isSubmitting}>
            Save Changes
          </Button>
        </form>
      </section>

      {/* ── Change Password ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-serif text-primary">Change Password</h2>
        <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            {...passwordForm.register("currentPassword")}
            error={passwordForm.formState.errors.currentPassword?.message}
          />
          <Input
            label="New Password"
            type="password"
            {...passwordForm.register("newPassword")}
            error={passwordForm.formState.errors.newPassword?.message}
          />
          <Input
            label="Confirm New Password"
            type="password"
            {...passwordForm.register("confirmPassword")}
            error={passwordForm.formState.errors.confirmPassword?.message}
          />
          <Button type="submit" loading={passwordForm.formState.isSubmitting}>
            Update Password
          </Button>
        </form>
      </section>
      {/* ── Blockchain Wallet ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-serif text-primary">Blockchain Wallet</h2>
        <div className="bg-surface-container-low rounded-2xl p-5 space-y-3 border border-outline-variant/10">
          {walletStatus?.linked ? (
            <>
              <div className="flex items-center gap-2">
                <Icon name="account_balance_wallet" className="text-primary" />
                <p className="text-sm font-mono break-all">{walletStatus.walletAddress}</p>
              </div>
              <p className="text-xs text-on-surface-variant">
                On-chain role: <span className="font-bold">{walletStatus.onChainRole}</span> · Account role:{" "}
                <span className="font-bold">{walletStatus.offChainRole}</span>
              </p>
              {Number(walletStatus.onChainRole) !==
                { FARMER: 1, COOPERATIVE: 2, TRANSPORTER: 3, CONSUMER: 4 }[walletStatus.offChainRole] && (
                <>
                  <p className="text-xs text-error">
                    Your wallet's on-chain role doesn't match your account role yet — blockchain actions will fail until
                    this is fixed.
                  </p>
                  <Button
                    variant="accent"
                    icon="sync"
                    loading={walletBusy}
                    onClick={handleRetryRole}
                    className="!py-2 !px-4 text-xs"
                  >
                    Retry role assignment
                  </Button>
                </>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-on-surface-variant">
                Link a MetaMask wallet so you can sign your own blockchain actions (create, certify, transit, deliver)
                as a {user?.role?.toLowerCase()}.
              </p>
              <Button
                variant="primary"
                icon="link"
                loading={walletBusy}
                onClick={handleConnectWallet}
                className="!py-2.5 !px-5 text-xs"
              >
                Connect MetaMask
              </Button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
