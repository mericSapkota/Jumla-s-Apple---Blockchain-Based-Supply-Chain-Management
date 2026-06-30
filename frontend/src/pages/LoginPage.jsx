import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { loginSchema } from "../schemas/authSchemas";
import { useAuth, roleHomePath } from "../auth/AuthContext";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Icon from "../components/ui/Icon";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values) => {
    try {
      const data = await login(values);
      toast.success(`Welcome back, ${data.fullName || "friend"}`);
      navigate(roleHomePath(data.role));
    } catch (err) {
      const message = err?.response?.data?.message || "Invalid email or password";
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed -bottom-12 -left-12 w-48 h-48 bg-tertiary-fixed opacity-10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -top-12 -right-12 w-64 h-64 bg-secondary-container opacity-10 rounded-full blur-3xl pointer-events-none" />

      <main className="w-full max-w-md relative z-10">
        <header className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Icon name="forest" className="text-4xl text-primary" />
            <h1 className="font-headline text-4xl font-bold tracking-tight text-primary">
              Jumla Trace
            </h1>
          </div>
          <p className="text-on-surface-variant tracking-wide opacity-80">
            From orchard to table — verified on blockchain
          </p>
        </header>

        <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-soft">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
              placeholder="••••••••"
              error={errors.password?.message}
              {...register("password")}
            />

            <Button type="submit" loading={isSubmitting} icon="arrow_forward" className="w-full">
              Sign in
            </Button>
          </form>

          <div className="text-center mt-6">
            <Link
              to="/consumer/scan"
              className="text-sm font-medium text-on-surface-variant inline-flex items-center gap-2 hover:text-primary transition-colors"
            >
              Consumer? Trace a batch instead
              <Icon name="qr_code_scanner" className="text-primary" size="18px" />
            </Link>
          </div>
        </div>

        <p className="text-center text-sm text-on-surface-variant mt-6">
          Don't have an account?{" "}
          <Link to="/register" className="font-bold text-primary hover:underline">
            Register here
          </Link>
        </p>
      </main>
    </div>
  );
}
