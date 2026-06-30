import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { registerSchema, ROLES } from "../schemas/authSchemas";
import { useAuth, roleHomePath } from "../auth/AuthContext";
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

  const onSubmit = async (values) => {
    try {
      const data = await registerUser(values);
      toast.success(`Welcome to Jumla Trace, ${data.fullName}`);
      navigate(roleHomePath(data.role));
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
            <h1 className="font-headline text-4xl font-bold tracking-tight text-primary">
              Jumla Trace
            </h1>
          </div>
          <p className="text-on-surface-variant tracking-wide opacity-80">Create your account</p>
        </header>

        <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-soft">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
