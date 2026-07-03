import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardShell from "../../components/layout/DashboardShell";
import StatusBadge from "../../components/batch/StatusBadge";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import { transitUpdateSchema } from "../../schemas/batchSchemas";
import { getBatchesByStatus, updateTransit, deliverBatch } from "../../api/batchApi";
import CertificateBanner from "../../components/certificate/CertificateBanner";

function TransitForm({ batch, onUpdated }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(transitUpdateSchema),
    defaultValues: { location: "", destination: batch.destination || "" },
  });

  const onSubmit = async (values) => {
    try {
      const updated = await updateTransit(batch.batchId, values);
      toast.success(`Checkpoint logged for ${batch.batchId}`);
      reset({ location: "", destination: values.destination });
      onUpdated(updated);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not update transit");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-surface-container-low rounded-xl p-4 space-y-3 border border-outline-variant/10"
    >
      <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Update logistics checkpoint</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          placeholder="Current checkpoint (e.g. Nepalgunj)"
          error={errors.location?.message}
          {...register("location")}
        />
        <Input placeholder="Destination" error={errors.destination?.message} {...register("destination")} />
      </div>
      <Button type="submit" variant="accent" icon="token" loading={isSubmitting} className="w-full">
        Update on blockchain
      </Button>
    </form>
  );
}

export default function TransporterDashboard() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deliveringId, setDeliveringId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [certified, inTransit] = await Promise.all([
        getBatchesByStatus("CERTIFIED"),
        getBatchesByStatus("IN_TRANSIT"),
      ]);
      setBatches([...inTransit, ...certified]);
    } catch {
      toast.error("Could not load shipments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpdated = (updated) => {
    setBatches((prev) => prev.map((b) => (b.batchId === updated.batchId ? updated : b)));
  };

  const handleDeliver = async (batchId) => {
    setDeliveringId(batchId);
    try {
      await deliverBatch(batchId);
      toast.success(`Batch ${batchId} marked delivered`);
      setBatches((prev) => prev.filter((b) => b.batchId !== batchId));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not mark delivered");
    } finally {
      setDeliveringId(null);
    }
  };

  return (
    <DashboardShell title="Jumla Trace" eyebrow="Transporter Hub" heading="Transit management">
      <CertificateBanner />
      {loading ? (
        <div className="bg-surface-container-lowest rounded-3xl shadow-soft p-10 text-center text-on-surface-variant text-sm">
          Loading…
        </div>
      ) : batches.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-3xl shadow-soft p-10 text-center space-y-2">
          <Icon name="local_shipping" className="text-4xl text-outline-variant" />
          <p className="text-sm text-on-surface-variant">No active shipments right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {batches.map((batch) => (
            <div
              key={batch.batchId}
              className="bg-surface-container-lowest rounded-xl p-5 shadow-soft border border-outline-variant/5 space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Batch ID</p>
                  <h4 className="font-headline text-lg font-bold text-primary">#{batch.batchId}</h4>
                </div>
                <StatusBadge status={batch.status} />
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase">Origin</p>
                  <p className="font-semibold">{batch.farmLocation}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase">Destination</p>
                  <p className="font-semibold">{batch.destination || "Not set"}</p>
                </div>
              </div>

              {batch.transitHistory?.length > 0 && (
                <div className="space-y-1 text-[11px] text-on-surface-variant border-t border-outline-variant/10 pt-3">
                  {batch.transitHistory.map((cp, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="font-semibold text-on-surface">{cp.location}</span>
                      <span>{new Date(cp.timestamp * 1000).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              <TransitForm batch={batch} onUpdated={handleUpdated} />

              {batch.status === "IN_TRANSIT" && (
                <Button
                  variant="primary"
                  icon="store"
                  loading={deliveringId === batch.batchId}
                  onClick={() => handleDeliver(batch.batchId)}
                  className="w-full"
                >
                  Mark delivered
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="text-center">
        <Link
          to="/batches/history"
          className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
        >
          <Icon name="receipt_long" size="18px" />
          View full batch history
        </Link>
      </div>
    </DashboardShell>
  );
}
