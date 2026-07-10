import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { jwtDecode } from "jwt-decode";
import { registerSchema, ROLES } from "../schemas/authSchemas";
import { useAuth, roleHomePath } from "../auth/AuthContext";
import { googleAuth } from "../api/authApi";
import GoogleButton from "../components/auth/GoogleButton";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Icon from "../components/ui/Icon";

const ROLE_ICONS = {
  FARMER: "potted_plant",
  COOPERATIVE: "groups",
  TRANSPORTER: "local_shipping",
  CONSUMER: "person",
};

export default function RegisterPage() {
  const { register: registerUser, completeAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Set once a Google credential has been obtained: email/full name in the
  // form are then read-only (the backend derives them from the verified
  // token, not from this form) and a password is no longer required.
  const [googleCredential, setGoogleCredential] = useState(null);
  const [submittingGoogle, setSubmittingGoogle] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "FARMER" },
  });

  const selectedRole = watch("role");
  const watchedEmail = watch("email");

  // Auto-fill email + full name from the Google ID token. Google never
  // supplies a date of birth, so that field stays a manual, editable input.
  const applyGoogleCredential = (credential) => {
    let profile;
    try {
      profile = jwtDecode(credential);
    } catch {
      toast.error("Could not read your Google account details.");
      return;
    }
    setGoogleCredential(credential);
    setValue("email", profile.email || "", { shouldValidate: true });
    setValue("fullName", profile.name || profile.email || "", { shouldValidate: true });
  };

  // If the user already tried "Continue with Google" on the login page and
  // has no account yet, that page hands the credential off here via router
  // state so they don't have to authenticate with Google a second time.
  useEffect(() => {
    if (location.state?.googleCredential) {
      applyGoogleCredential(location.state.googleCredential);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const useDifferentMethod = () => {
    setGoogleCredential(null);
    reset({ role: getValues("role"), dateOfBirth: getValues("dateOfBirth"), email: "", fullName: "" });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Trigger zod validation via react-hook-form
      setValue("profilePicture", e.target.files, { shouldValidate: true });
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (values) => {
    try {
      // Extract the File from the FileList before building the JSON payload
      const profilePictureFile = values.profilePicture?.[0] ?? null;
      const { profilePicture: _ignored, confirmPassword: _ignored2, ...jsonPayload } = values;

      const data = await registerUser(jsonPayload, profilePictureFile);
      toast.success(data.message || "Registration successful. Please check your email to verify your account.");
      navigate("/login");
    } catch (err) {
      const message = err?.response?.data?.message || "Could not register. Try a different email.";
      toast.error(message);
    }
  };

  // Google signup: email/full name come from the verified credential; role +
  // date of birth still come from the form, filled in after the auto-fill.
  const onGoogleSubmit = async () => {
    const { role, dateOfBirth } = getValues();
    if (!role) {
      toast.error("Select a role to finish signing up.");
      return;
    }
    if (!dateOfBirth) {
      toast.error("Enter your date of birth to finish signing up.");
      return;
    }
    setSubmittingGoogle(true);
    try {
      const data = await googleAuth({ credential: googleCredential, role, dateOfBirth });
      completeAuth(data);
      toast.success(`Welcome to Jumla Trace, ${data.fullName}`);
      navigate(roleHomePath(data.role));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Google sign-up failed.");
    } finally {
      setSubmittingGoogle(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed -bottom-12 -left-12 w-48 h-48 bg-tertiary-fixed opacity-10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -top-12 -right-12 w-64 h-64 bg-secondary-container opacity-10 rounded-full blur-3xl pointer-events-none" />

      <main className="w-full max-w-md relative z-10">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Icon name="forest" className="text-4xl text-primary" />
            <h1 className="font-headline text-4xl font-bold tracking-tight text-primary">Jumla Trace</h1>
          </div>
          <p className="text-on-surface-variant tracking-wide opacity-80">Create your account</p>
        </header>

        <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-soft">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Role selector */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">
                Select your role
              </span>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setValue("role", role, { shouldValidate: true })}
                    className={`text-sm font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${
                      selectedRole === role
                        ? "bg-primary text-on-primary shadow-sm"
                        : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                  >
                    <Icon name={ROLE_ICONS[role]} size="20px" />
                    {role.charAt(0) + role.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
              {errors.role && <p className="text-xs text-error px-1">{errors.role.message}</p>}
            </div>

            {/* Profile picture */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">
                Profile picture <span className="normal-case font-normal">(optional)</span>
              </span>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center overflow-hidden border-2 border-dashed border-outline hover:border-primary transition-colors flex-shrink-0"
                >
                  {previewUrl ? (
                    <img src={previewUrl} alt="Profile preview" className="w-full h-full object-cover" />
                  ) : (
                    <Icon name="add_a_photo" className="text-2xl text-on-surface-variant" />
                  )}
                </button>
                <div className="text-xs text-on-surface-variant space-y-0.5">
                  <p>JPG, PNG or WEBP · max 5 MB</p>
                  {previewUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewUrl(null);
                        setValue("profilePicture", null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="text-error underline"
                    >
                      Remove photo
                    </button>
                  )}
                </div>
              </div>
              {/* hidden file input – NOT registered with RHF directly so we don't
                  put a FileList in the form JSON; we manage it manually above */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={handleFileChange}
              />
              {errors.profilePicture && <p className="text-xs text-error px-1">{errors.profilePicture.message}</p>}
            </div>

            <Input
              label="Full name"
              icon="badge"
              placeholder="Ram Bahadur"
              error={errors.fullName?.message}
              readOnly={!!googleCredential}
              className={googleCredential ? "opacity-70 cursor-not-allowed" : ""}
              {...register("fullName")}
            />
            <Input
              label="Email address"
              icon="mail"
              type="email"
              placeholder="name@jumla.org"
              error={errors.email?.message}
              readOnly={!!googleCredential}
              className={googleCredential ? "opacity-70 cursor-not-allowed" : ""}
              {...register("email")}
            />
            <Input
              label="Date of birth"
              icon="cake"
              type="date"
              error={errors.dateOfBirth?.message}
              {...register("dateOfBirth")}
            />

            {!googleCredential && (
              <>
                <Input
                  label="Password"
                  icon="lock"
                  type="password"
                  placeholder="At least 6 characters"
                  error={errors.password?.message}
                  {...register("password")}
                />
                <Input
                  label="Confirm password"
                  icon="lock_reset"
                  type="password"
                  placeholder="Re-enter your password"
                  error={errors.confirmPassword?.message}
                  {...register("confirmPassword")}
                />
              </>
            )}

            {googleCredential ? (
              <Button
                type="button"
                onClick={onGoogleSubmit}
                loading={submittingGoogle}
                icon="arrow_forward"
                className="w-full"
              >
                Finish signing up with Google
              </Button>
            ) : (
              <Button type="submit" loading={isSubmitting} icon="arrow_forward" className="w-full">
                Create account
              </Button>
            )}
          </form>

          {googleCredential ? (
            <p className="text-center text-xs text-on-surface-variant mt-6">
              Continuing as <span className="font-bold">{watchedEmail}</span> via Google ·{" "}
              <button type="button" onClick={useDifferentMethod} className="font-bold text-primary hover:underline">
                use email &amp; password instead
              </button>
            </p>
          ) : (
            <div className="mt-6">
              <GoogleButton onCredential={applyGoogleCredential} text="signup_with" />
            </div>
          )}
        </div>

        <p className="text-center text-sm text-on-surface-variant mt-6">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </main>
    </div>
  );
}
