import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardShell from "../../components/layout/DashboardShell";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import AIFreshnessCheck from "../../components/batch/AIFreshnessCheck";
import QRDisplay from "../../components/batch/QRDisplay";
import { createBatchSchema, APPLE_VARIETIES } from "../../schemas/batchSchemas";
import { createBatch, getNextBatchId } from "../../api/batchApi";
import { createBatchOnChain } from "../../blockchain/batchContract";
import { useAuth } from "../../auth/AuthContext";
import CertificateBanner from "../../components/certificate/CertificateBanner";

export default function FarmerDashboard() {
  const { user } = useAuth();
  const [selectedBatch, setSelectedBatch] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createBatchSchema),
    defaultValues: { aiResult: "PENDING", ipfsHash: "", photoPath: "" },
  });

  const onSubmit = async (values) => {
    try {
      if (values.aiResult !== "FRESH") {
        toast.error("Cannot create batch: Apple is not fresh.");
        return;
      }

      // 1) Reserve a unique batch ID from the backend before touching MetaMask.
      const batchId = await getNextBatchId();

      // 2) Send the actual createBatch() transaction, signed by the farmer's
      //    own connected wallet. This is what the contract's role check sees.
      const harvestEpochSeconds = Math.floor(new Date(values.harvestDate).getTime() / 1000);
      const txHash = await createBatchOnChain({
        batchId,
        farmerName: user?.fullName || "",
        farmLocation: values.farmLocation,
        appleVariety: values.appleVariety,
        weightKg: Number(values.weightKg),
        harvestEpochSeconds,
        ipfsHash: values.ipfsHash || "",
        aiResult: values.aiResult,
      });

      // 3) Now that it's confirmed on-chain, ask the backend to verify the
      //    tx and mirror the record into Postgres.
      const created = await createBatch({ batchId, txHash, photoPath: values.photoPath });

      toast.success(`Batch ${created.batchId} registered on chain`);
      reset({ aiResult: "PENDING", ipfsHash: "", photoPath: "" });
      setSelectedBatch(created);
    } catch (err) {
      toast.error(err?.message || err?.response?.data?.message || "Could not create batch");
    }
  };

  return (
    <DashboardShell title="Jumla Trace" eyebrow="Farmer Hub" heading={`Good day, ${user?.fullName || "Farmer"} 👋`}>
      <CertificateBanner />
      {/* Create batch form */}
      <section className="bg-surface-container-lowest rounded-3xl shadow-soft overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Icon name="eco" className="text-9xl" />
        </div>
        <div className="p-6 space-y-6 relative z-10">
          <h3 className="font-headline text-xl font-bold text-primary">Create new batch</h3>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input label="Harvest date" type="date" error={errors.harvestDate?.message} {...register("harvestDate")} />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Weight (kg)"
                type="number"
                step="0.1"
                placeholder="450"
                error={errors.weightKg?.message}
                {...register("weightKg", { valueAsNumber: true })}
              />
              <Select
                label="Variety"
                options={APPLE_VARIETIES}
                placeholder="Select variety"
                error={errors.appleVariety?.message}
                {...register("appleVariety")}
              />
            </div>

            <Input
              label="Farm location"
              icon="location_on"
              placeholder="Jumla North Orchard B-12"
              error={errors.farmLocation?.message}
              {...register("farmLocation")}
            />

            <AIFreshnessCheck
              onResult={(result, photoPath) => {
                setValue("aiResult", result);
                setValue("photoPath", photoPath || "");
              }}
            />

            <Button type="submit" loading={isSubmitting} icon="hub" className="w-full py-4">
              Register batch on blockchain
            </Button>
          </form>
        </div>
      </section>

      {/* QR for most recently created batch */}
      {selectedBatch && (
        <section className="bg-surface-container-lowest rounded-3xl shadow-soft p-6 flex items-center gap-6 flex-wrap">
          <QRDisplay batchId={selectedBatch.batchId} />
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Print &amp; attach to crate
            </p>
            <p className="font-headline text-lg font-bold text-primary">#{selectedBatch.batchId}</p>
            <p className="text-xs text-on-surface-variant">Consumers scan this to see the full journey.</p>
          </div>
        </section>
      )}

      <div className="text-center">
        <Link
          to="/batches/history"
          className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
        >
          <Icon name="receipt_long" size="18px" />
          View all my batches & history
        </Link>
      </div>
    </DashboardShell>
  );
}
