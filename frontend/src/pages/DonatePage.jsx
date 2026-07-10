import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { initiateDonation, redirectToEsewa } from "../api/donationApi";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Icon from "../components/ui/Icon";

const PRESET_AMOUNTS = [50, 100, 250, 500];

export default function DonatePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [amount, setAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // success | failed | null — set when eSewa bounces the donor back
  const status = searchParams.get("status");
  const paidAmount = searchParams.get("amount");
  const [donationData, setDonationData] = useState(null);
  const toasted = useRef(false);

  // Parse donation data from URL (recipient info, etc.)
  useEffect(() => {
    const data = searchParams.get("data");
    if (data) {
      try {
        setDonationData(JSON.parse(decodeURIComponent(data)));
      } catch (e) {
        console.error("Could not parse donation data", e);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (!status || toasted.current) return;
    toasted.current = true;
    if (status === "success") {
      toast.success("Thank you for your support! 💚");
    } else {
      toast.error("Payment was not completed.");
    }
  }, [status]);

  const effectiveAmount = customAmount ? Number(customAmount) : amount;

  const handleDonate = async (e) => {
    e.preventDefault();
    if (!effectiveAmount || effectiveAmount < 10) {
      toast.error("Minimum donation is Rs. 10");
      return;
    }
    setSubmitting(true);
    try {
      const data = await initiateDonation({
        amount: effectiveAmount,
        donorName: donorName || null,
        message: message || null,
      });
      redirectToEsewa(data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not start the payment. Please try again.");
      setSubmitting(false);
    }
  };

  if (status === "success") {
    const amount = donationData?.amount || paidAmount;
    const recipient = donationData?.recipientName;
    return (
      <Shell>
        <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-soft text-center space-y-4">
          <Icon name="volunteer_activism" className="text-5xl text-primary" />
          <h2 className="font-bold text-xl text-on-surface">Thank you!</h2>
          <p className="text-on-surface-variant">Your donation{amount ? ` of Rs. ${amount}` : ""} has been received.</p>
          {recipient && (
            <div className="bg-surface-container-high rounded-2xl p-4 space-y-1">
              <p className="text-xs uppercase tracking-widest text-on-surface-variant">Received by</p>
              <p className="font-bold text-lg text-on-surface">{recipient}</p>
            </div>
          )}
          <p className="text-sm text-on-surface-variant">
            Thank you for supporting the project. Your contribution helps build better supply chain transparency.
          </p>
          <Button icon="refresh" className="w-full" onClick={() => setSearchParams({})}>
            Donate again
          </Button>
          <Link to="/" className="block text-sm font-bold text-primary hover:underline">
            Back to home
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-soft">
        <form onSubmit={handleDonate} className="space-y-6">
          <div className="space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">
              Choose an amount (Rs.)
            </span>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setAmount(preset);
                    setCustomAmount("");
                  }}
                  className={`text-sm font-bold py-3 rounded-xl transition-all active:scale-95 ${
                    !customAmount && amount === preset
                      ? "bg-primary text-on-primary shadow-sm"
                      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <Input
              icon="payments"
              type="number"
              min="10"
              placeholder="Or enter a custom amount"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
            />
          </div>

          <Input
            label="Your name (optional)"
            icon="badge"
            placeholder="Anonymous apple lover"
            value={donorName}
            onChange={(e) => setDonorName(e.target.value)}
          />
          <Input
            label="Message (optional)"
            icon="chat_bubble"
            placeholder="Keep up the good work!"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <Button type="submit" loading={submitting} icon="volunteer_activism" className="w-full">
            Donate Rs. {effectiveAmount || 0} with eSewa
          </Button>

          <p className="text-[11px] text-center text-on-surface-variant">
            You'll be redirected to eSewa to complete the payment securely.
          </p>
        </form>
      </div>
    </Shell>
  );
}

function Shell({ children }) {
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
          <p className="text-on-surface-variant tracking-wide opacity-80">Buy us a coffee — support the project</p>
        </header>
        {children}
        <p className="text-center text-sm text-on-surface-variant mt-6">
          {/* <Link to="/" className="font-bold text-primary hover:underline">
            Back to home
          </Link> */}
        </p>
      </main>
    </div>
  );
}
