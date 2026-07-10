import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { registerSchema, ROLES } from "../schemas/authSchemas";
import { useAuth } from "../auth/AuthContext";
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
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "FARMER" },
  });

  const selectedRole = watch("role");

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
      const { profilePicture: _ignored, ...jsonPayload } = values;

      const data = await registerUser(jsonPayload, profilePictureFile);
      toast.success(data.message || "Registration successful. Please check your email to verify your account.");
      navigate("/login");
    } catch (err) {
      const message = err?.response?.data?.message || "Could not register. Try a different email.";
      toast.error(message);
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
              {...register("fullName")}
            />
            <Input
              label="Email address"
              icon="mail"
              type="email"
              placeholder="name@jumla.org"
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              label="Date of birth"
              icon="cake"
              type="date"
              error={errors.dateOfBirth?.message}
              {...register("dateOfBirth")}
            />
            <Input
              label="Password"
              icon="lock"
              type="password"
              placeholder="At least 6 characters"
              error={errors.password?.message}
              {...register("password")}
            />

            <Button type="submit" loading={isSubmitting} icon="arrow_forward" className="w-full">
              Create account
            </Button>
          </form>
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
