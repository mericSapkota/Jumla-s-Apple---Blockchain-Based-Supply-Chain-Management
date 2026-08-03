import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { loginSchema } from "../schemas/authSchemas";
import { useAuth, roleHomePath } from "../auth/AuthContext";
import { googleAuth, verifyTwoFactor } from "../api/authApi";
import GoogleButton from "../components/auth/GoogleButton";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Icon from "../components/ui/Icon";
import Logo from "../components/ui/Logo";
import TopAppBar from "../components/layout/TopAppBar";

export default function LoginPage() {
  const { login, completeAuth } = useAuth();
  const navigate = useNavigate();

  // When set, the password step is replaced by the 2FA code step.
  const [pendingEmail, setPendingEmail] = useState(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const finishLogin = (data) => {
    toast.success(`Welcome back, ${data.fullName || "friend"}`);
    navigate(roleHomePath(data.role));
  };

  const onSubmit = async (values) => {
    try {
      const data = await login(values);
      if (data.twoFactorRequired) {
        setPendingEmail(values.email);
        setCode("");
        toast.success(data.message || "We emailed you a verification code.");
        return;
      }
      finishLogin(data);
    } catch (err) {
      const message = err?.response?.data?.message || "Invalid email or password";
      toast.error(message);
    }
  };

  const onVerifyCode = async (e) => {
    e.preventDefault();
    if (code.trim().length !== 6) {
      toast.error("Enter the 6-digit code from your email.");
      return;
    }
    setVerifying(true);
    try {
      const data = await verifyTwoFactor({ email: pendingEmail, code: code.trim() });
      completeAuth(data);
      finishLogin(data);
    } catch (err) {
      const message = err?.response?.data?.message || "Could not verify the code.";
      toast.error(message);
      // Expired / locked out — go back to the password step.
      if (/expired|too many|pending/i.test(message)) setPendingEmail(null);
    } finally {
      setVerifying(false);
    }
  };

  const resendCode = async () => {
    try {
      await login({ email: pendingEmail, password: getValues("password") });
      toast.success("A new code has been sent.");
    } catch {
      toast.error("Could not resend the code. Please log in again.");
      setPendingEmail(null);
    }
  };

  const onGoogleCredential = async (credential) => {
    try {
      const data = await googleAuth({ credential });
      if (data.needsProfile) {
        toast("Pick a role to finish creating your account.", { icon: "👋" });
        navigate("/register", { state: { googleCredential: credential } });
        return;
      }
      completeAuth(data);
      finishLogin(data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Google sign-in failed.");
    }
  };
  const title = "Jumla Trace";

  return (
    <div>
      <TopAppBar title={title} />
      <div className="min-h-screen bg-surface flex items-center justify-center p-4 relative overflow-hidden">
        <div className="fixed -bottom-12 -left-12 w-48 h-48 bg-tertiary-fixed opacity-10 rounded-full blur-3xl pointer-events-none" />
        <div className="fixed -top-12 -right-12 w-64 h-64 bg-secondary-container opacity-10 rounded-full blur-3xl pointer-events-none" />

        <main className="w-full max-w-md relative z-10">
          <header className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Logo size={64} />
              <h1 className="font-headline text-4xl font-bold tracking-tight text-primary">Jumla Trace</h1>
            </div>
            <p className="text-on-surface-variant tracking-wide opacity-80">
              From orchard to table — verified on blockchain
            </p>
          </header>

          <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-soft">
            {pendingEmail ? (
              <form onSubmit={onVerifyCode} className="space-y-6">
                <div className="text-center space-y-1">
                  <Icon name="shield_lock" className="text-3xl text-primary" />
                  <h2 className="font-bold text-on-surface">Two-factor verification</h2>
                  <p className="text-sm text-on-surface-variant">
                    We emailed a 6-digit code to <span className="font-bold">{pendingEmail}</span>
                  </p>
                </div>
                <Input
                  label="Verification code"
                  icon="pin"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="text-center tracking-[0.5em] font-bold"
                />
                <Button type="submit" loading={verifying} icon="lock_open" className="w-full">
                  Verify and sign in
                </Button>
                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => setPendingEmail(null)}
                    className="text-on-surface-variant hover:underline"
                  >
                    Back
                  </button>
                  <button type="button" onClick={resendCode} className="font-bold text-primary hover:underline">
                    Resend code
                  </button>
                </div>
              </form>
            ) : (
              <>
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

                <div className="mt-6">
                  <GoogleButton onCredential={onGoogleCredential} text="signin_with" />
                </div>
              </>
            )}

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
    </div>
  );
}
