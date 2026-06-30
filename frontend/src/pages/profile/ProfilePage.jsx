import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { getMyProfile, updateProfile, changePassword } from "../../api/userApi";
import { updateProfileSchema, changePasswordSchema } from "../../schemas/profileSchemas";
import { useAuth } from "../../auth/AuthContext";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import TopAppBar from "../../components/layout/TopAppBar";

export default function ProfilePage() {
  const { updateUserInfo } = useAuth();
  const [loading, setLoading] = useState(true);

  const profileForm = useForm({ resolver: zodResolver(updateProfileSchema) });
  const passwordForm = useForm({ resolver: zodResolver(changePasswordSchema) });

  useEffect(() => {
    getMyProfile()
      .then(({ data }) => {
        profileForm.reset({ fullName: data.fullName, email: data.email });
      })
      .catch(() => toast.error("Failed to load profile", { id: "profile-load-error" }))
      .finally(() => setLoading(false));
  }, []);

  const onSubmitProfile = async (values) => {
    try {
      console.log("Attempting update...");
      const { data } = await updateProfile(values);
      console.log("Response data:", data);

      if (data.token) {
        localStorage.setItem("jumla_token", data.token);
      }
      updateUserInfo({ fullName: data.fullName, email: data.email, token: data.token });
      toast.success("Successfully updated profile.", { id: "profile-update-success" });
    } catch (err) {
      console.error("Update failed:", err);
      console.error("Error response:", err.response);
      console.error("Error status:", err.response?.status);
      toast.error("Failed to update profile. Email already exists.", { id: "profile-update-error" });
    }
  };

  const onSubmitPassword = async (values) => {
    try {
      await changePassword(values);
      toast.success("Password changed.", { id: "password-change-success" });
      passwordForm.reset();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password", {
        id: "password-change-error",
      });
    }
  };

  if (loading) return <p>Loading profile…</p>;

  return (
    <div className="max-w-xl mx-auto space-y-10 py-8 px-2">
      <TopAppBar title="Profile" />
      <section className="space-y-4">
        <h2 className="text-xl font-serif text-primary mb-4">Profile Details</h2>
        <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-4">
          <Input
            label="Full Name"
            {...profileForm.register("fullName")}
            error={profileForm.formState.errors.fullName}
          />
          <Input
            label="Email"
            type="email"
            {...profileForm.register("email")}
            error={profileForm.formState.errors.email}
          />

          <Button type="submit" disabled={profileForm.formState.isSubmitting}>
            Save Changes
          </Button>
        </form>
      </section>

      <section>
        <h2 className="text-xl font-serif text-primary mb-4">Change Password</h2>
        <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            {...passwordForm.register("currentPassword")}
            error={passwordForm.formState.errors.currentPassword}
          />
          <Input
            label="New Password"
            type="password"
            {...passwordForm.register("newPassword")}
            error={passwordForm.formState.errors.newPassword}
          />
          <Input
            label="Confirm New Password"
            type="password"
            {...passwordForm.register("confirmPassword")}
            error={passwordForm.formState.errors.confirmPassword}
          />
          <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
            Update Password
          </Button>
        </form>
      </section>
    </div>
  );
}
