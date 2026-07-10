import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { verifyEmail, resendVerification } from "../api/authApi";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Icon from "../components/ui/Icon";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  // verifying | success | error
  const [status, setStatus] = useState(() => (token ? "verifying" : "error"));
  const [errorMessage, setErrorMessage] = useState(token ? "" : "This verification link is missing a token.");
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const attempted = useRef(false);

  useEffect(() => {
    if (!token || attempted.current) return;
    attempted.current = true;

    verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setErrorMessage(err?.response?.data?.message || "This verification link is invalid or has expired.");
      });
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail) return;
    setResending(true);
    try {
      const data = await resendVerification(resendEmail);
      toast.success(data.message || "Verification email sent. Please check your inbox.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not resend verification email.");
    } finally {
      setResending(false);
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
        </header>

        <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-soft text-center space-y-4">
          {status === "verifying" && (
            <>
              <Icon name="hourglass_top" className="text-4xl text-on-surface-variant animate-pulse" />
              <p className="text-on-surface-variant">Verifying your email…</p>
            </>
          )}

          {status === "success" && (
            <>
              <Icon name="check_circle" className="text-4xl text-primary" />
              <h2 className="font-bold text-lg text-on-surface">Email verified</h2>
              <p className="text-on-surface-variant">You can now log in to your account.</p>
              <Link to="/login">
                <Button icon="arrow_forward" className="w-full mt-2">
                  Go to login
                </Button>
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <Icon name="error" className="text-4xl text-error" />
              <h2 className="font-bold text-lg text-on-surface">Verification failed</h2>
              <p className="text-on-surface-variant">{errorMessage}</p>

              <form onSubmit={handleResend} className="space-y-3 pt-2 text-left">
                <Input
                  label="Resend verification link to"
                  icon="mail"
                  type="email"
                  placeholder="name@jumla.org"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                />
                <Button type="submit" loading={resending} icon="send" className="w-full">
                  Resend verification email
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-on-surface-variant mt-6">
          <Link to="/login" className="font-bold text-primary hover:underline">
            Back to login
          </Link>
        </p>
      </main>
    </div>
  );
}
