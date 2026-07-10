import { useEffect, useRef } from "react";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GSI_SRC = "https://accounts.google.com/gsi/client";

let gsiLoading = null;
function loadGsi() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!gsiLoading) {
    gsiLoading = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = GSI_SRC;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  return gsiLoading;
}

/**
 * Renders the official "Continue with Google" button. Calls
 * onCredential(idToken) when the user completes the Google popup.
 * Renders nothing (with a console warning) until VITE_GOOGLE_CLIENT_ID is set.
 */
export default function GoogleButton({ onCredential, text = "continue_with" }) {
  const containerRef = useRef(null);
  const callbackRef = useRef(onCredential);

  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!CLIENT_ID) {
      console.warn("VITE_GOOGLE_CLIENT_ID is not set — Google sign-in button is hidden.");
      return;
    }
    let cancelled = false;
    loadGsi()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response) => callbackRef.current?.(response.credential),
        });
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: "outline",
          size: "large",
          width: 320,
          text,
          shape: "pill",
        });
      })
      .catch(() => console.warn("Could not load Google sign-in script."));
    return () => {
      cancelled = true;
    };
  }, [text]);

  if (!CLIENT_ID) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-outline-variant/30" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">or</span>
        <div className="flex-1 h-px bg-outline-variant/30" />
      </div>
      <div ref={containerRef} className="flex justify-center" />
    </div>
  );
}
