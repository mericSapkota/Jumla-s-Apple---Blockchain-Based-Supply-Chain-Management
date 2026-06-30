import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import TopAppBar from "../../components/layout/TopAppBar";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import TransitTimeline from "../../components/batch/TransitTimeline";
import QrScanner from "../../components/batch/QrScanner";
import { batchIdSchema } from "../../schemas/batchSchemas";
import { getBatch } from "../../api/batchApi";

const TX_FIELDS = [
  { key: "txHashCreate", label: "Created" },
  { key: "txHashCertify", label: "Certified" },
  { key: "txHashTransit", label: "Transit" },
  { key: "txHashDeliver", label: "Delivered" },
];

const BATCH_ID_PATTERN = /^[A-Za-z0-9-]{3,40}$/;

export default function ConsumerScanPage() {
  const [mode, setMode] = useState("scan");
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanKey, setScanKey] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(batchIdSchema) });

  const fetchBatch = async (batchId) => {
    setLoading(true);
    setBatch(null);
    try {
      const data = await getBatch(batchId.trim());
      setBatch(data);
    } catch (err) {
      const message = err?.response?.status === 404
        ? `No batch found for "${batchId}"`
        : "Could not load batch trace";
      toast.error(message, { id: "batch-fetch-error" });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (values) => fetchBatch(values.batchId);

  const handleScanResult = (text) => {
    if (!BATCH_ID_PATTERN.test(text)) {
      toast.error("That doesn't look like a Jumla batch code", { id: "invalid-qr" });
      setScanKey((k) => k + 1);
      return;
    }
    setValue("batchId", text);
    fetchBatch(text);
    setMode("manual");
  };

  return (
    <div className="min-h-screen bg-surface pb-16">
      <TopAppBar title="Jumla Trace" />
      <main className="pt-24 px-5 pb-12 max-w-md mx-auto space-y-8">
        <section className="text-center space-y-3">
          <h2 className="font-headline text-4xl font-bold text-primary tracking-tight leading-tight">
            Trace your apple 🍎
          </h2>
          <p className="text-on-surface-variant text-sm px-4">
            Scan the QR code on your packaging or enter the batch ID to see its journey.
          </p>
        </section>

        <div className="bg-surface-container-lowest rounded-3xl p-1.5 shadow-soft">
          <div className="flex p-1 gap-1">
            <button
              onClick={() => setMode("scan")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold tracking-wider transition-all ${
                mode === "scan"
                  ? "bg-primary text-on-primary"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <Icon name="qr_code_scanner" size="16px" />
              Scan QR code
            </button>
            <button
              onClick={() => setMode("manual")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold tracking-wider transition-all ${
                mode === "manual"
                  ? "bg-primary text-on-primary"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <Icon name="pin" size="16px" />
              Enter batch ID
            </button>
          </div>

          <div className="p-5">
            {mode === "scan" ? (
              <div className="space-y-3">
                <QrScanner key={scanKey} onScan={handleScanResult} onError={() => {}} />
                <button
                  onClick={() => setScanKey((k) => k + 1)}
                  className="text-xs text-on-surface-variant flex items-center gap-1 mx-auto hover:text-primary"
                >
                  <Icon name="refresh" size="14px" />
                  Restart camera
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="Batch identifier"
                  placeholder="e.g. JML-2025-AB12"
                  error={errors.batchId?.message}
                  {...register("batchId")}
                />
                <Button type="submit" loading={loading} icon="arrow_forward" className="w-full">
                  Trace now
                </Button>
              </form>
            )}
          </div>
        </div>

        {loading && (
          <p className="text-center text-sm text-on-surface-variant">Looking up batch…</p>
        )}

        {batch && (
          <>
            <section className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="font-headline text-2xl font-bold text-primary">Harvest journey</h3>
                <span className="bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                  Live trace
                </span>
              </div>
              <TransitTimeline batch={batch} />
            </section>

            <section className="pt-4 border-t border-outline-variant/10">
              <div className="bg-primary/5 rounded-3xl p-6 text-center space-y-4">
                <div className="inline-flex items-center gap-2 bg-primary px-4 py-2 rounded-full text-white text-[10px] font-bold tracking-widest uppercase shadow-lg">
                  <Icon name="verified_user" filled size="14px" />
                  Verified on Ethereum blockchain
                </div>
                <div className="space-y-2">
                  {TX_FIELDS.filter((f) => batch[f.key]).map((f) => (
                    <a
                      key={f.key}
                      href={`https://sepolia.etherscan.io/tx/${batch[f.key]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block bg-white/60 backdrop-blur-sm rounded-xl p-3 hover:bg-white transition-colors"
                    >
                      <p className="text-[10px] font-bold uppercase text-on-surface-variant mb-1">
                        {f.label}
                      </p>
                      <p className="font-mono text-[9px] text-primary break-all leading-relaxed">
                        {batch[f.key]}
                      </p>
                    </a>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
