import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { getMyProfile, updateProfile, changePassword } from "../../api/userApi";
import { updateProfilePicture } from "../../api/authApi";
import { updateProfileSchema, changePasswordSchema } from "../../schemas/profileSchemas";
import { useAuth } from "../../auth/AuthContext";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import TopAppBar from "../../components/layout/TopAppBar";
import Icon from "../../components/ui/Icon";

export default function ProfilePage() {
  const { updateUserInfo } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profilePicturePath, setProfilePicturePath] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const profileForm = useForm({ resolver: zodResolver(updateProfileSchema) });
  const passwordForm = useForm({ resolver: zodResolver(changePasswordSchema) });

  useEffect(() => {
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
    try {
      const { data } = await updateProfile(values);
      if (data.token) localStorage.setItem("jumla_token", data.token);
      updateUserInfo({ fullName: data.fullName, email: data.email, token: data.token });
      toast.success("Profile updated.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile.");
    }
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
      const { data } = await updateProfilePicture(file);
      setProfilePicturePath(data.profilePicturePath);
      toast.success("Profile picture updated.");
    } catch (err) {
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
    </div>
  );
}
