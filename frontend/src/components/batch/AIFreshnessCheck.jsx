import { useState, useRef } from "react";
import { checkAppleFreshness } from "../../api/aiApi";
import Icon from "../ui/Icon";
import toast from "react-hot-toast";

const RESULT_STYLES = {
  FRESH: "bg-tertiary-fixed text-on-tertiary-fixed",
  ROTTEN: "bg-error-container text-on-error-container",
  UNKNOWN: "bg-surface-container-high text-on-surface-variant",
};

export default function AIFreshnessCheck({ onResult }) {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setResult(null);
    setPreview(URL.createObjectURL(selected));
  };

  const handleCheck = async () => {
    if (!file) return;
    setChecking(true);
    try {
      const { result: aiResult } = await checkAppleFreshness(file);
      setResult(aiResult);
      onResult?.(aiResult);
      toast.success(`AI check complete: ${aiResult}`);
    } catch (err) {
      toast.error(err.message || "AI freshness check failed");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">
        Freshness Verification
      </label>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {!preview ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-outline-variant rounded-2xl p-8 flex flex-col items-center justify-center bg-surface-bright/50 hover:bg-surface-container-low transition-colors group"
        >
          <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Icon name="add_a_photo" className="text-primary text-3xl" />
          </div>
          <p className="text-xs font-medium text-on-surface-variant text-center leading-relaxed">
            Upload an apple photo for
            <br />
            <span className="text-primary font-bold">AI freshness check</span>
          </p>
        </button>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-2xl overflow-hidden bg-surface-container-low">
            <img src={preview} alt="Apple preview" className="w-full h-48 object-cover" />
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                setFile(null);
                setResult(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center"
              aria-label="Remove photo"
            >
              <Icon name="close" size="18px" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCheck}
              disabled={checking}
              className="flex-1 bg-primary text-on-primary font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
            >
              {checking ? (
                <Icon name="progress_activity" className="animate-spin" />
              ) : (
                <Icon name="science" />
              )}
              {checking ? "Checking…" : "Run AI Check"}
            </button>

            {result && (
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-sm text-xs font-bold ${
                  RESULT_STYLES[result] || RESULT_STYLES.UNKNOWN
                }`}
              >
                <Icon name="check_circle" filled size="16px" />
                {result}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
