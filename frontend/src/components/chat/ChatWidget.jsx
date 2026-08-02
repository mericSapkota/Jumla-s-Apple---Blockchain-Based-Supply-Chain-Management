import { useEffect, useRef, useState } from "react";
import Icon from "../ui/Icon";
import { getChatEnabled, sendChatMessage, getChatHistory } from "../../api/chatApi";

const SESSION_KEY = "jumla_chat_session";

function getOrCreateSessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export default function ChatWidget() {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]); // {role, content}
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const sessionId = useRef(getOrCreateSessionId());
  const scrollRef = useRef(null);

  // Only render the widget if the admin has the AI assistant turned on.
  useEffect(() => {
    getChatEnabled()
      .then((data) => setEnabled(Boolean(data?.enabled)))
      .catch(() => setEnabled(false));
  }, []);

  // Load any prior transcript the first time the panel is opened.
  useEffect(() => {
    if (!open || messages.length > 0) return;
    getChatHistory(sessionId.current)
      .then((history) =>
        setMessages(history.map((m) => ({ role: m.role, content: m.content })))
      )
      .catch(() => {});
  }, [open, messages.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setSending(true);
    try {
      const reply = await sendChatMessage(sessionId.current, text);
      setMessages((prev) => [...prev, { role: "assistant", content: reply.content }]);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Sorry, something went wrong. Please try again in a moment.";
      setMessages((prev) => [...prev, { role: "assistant", content: msg }]);
    } finally {
      setSending(false);
    }
  };

  if (!enabled) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* Chat panel */}
      {open && (
        <div className="mb-3 w-[92vw] max-w-sm h-[70vh] max-h-[560px] bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/30 flex flex-col overflow-hidden">
          <header className="bg-primary text-on-primary px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="support_agent" />
              <div>
                <p className="font-bold leading-tight">Jumla Trace Assistant</p>
                <p className="text-[11px] opacity-80">Ask about tracing, batches & more</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="hover:opacity-80">
              <Icon name="close" />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-surface">
            {messages.length === 0 && (
              <div className="text-center text-on-surface-variant text-sm mt-6 px-4">
                👋 Hi! I'm the Jumla Trace assistant. Ask me anything about tracing apples,
                registering batches, or verifying a QR code.
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap break-words ${
                    m.role === "user"
                      ? "bg-primary text-on-primary rounded-br-sm"
                      : "bg-surface-container-high text-on-surface rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-surface-container-high text-on-surface-variant rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-sm">
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce">•</span>
                    <span className="animate-bounce [animation-delay:0.15s]">•</span>
                    <span className="animate-bounce [animation-delay:0.3s]">•</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="p-3 border-t border-outline-variant/20 flex items-center gap-2 bg-surface-container-lowest">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message…"
              className="flex-1 bg-surface-container-low border-none rounded-full px-4 py-2.5 text-sm text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary-fixed outline-none"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Send message"
              className="w-10 h-10 shrink-0 rounded-full bg-primary text-on-primary flex items-center justify-center disabled:opacity-40"
            >
              <Icon name="send" size="20px" />
            </button>
          </form>
        </div>
      )}

      {/* Launcher button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Minimize chat" : "Open chat"}
        className="w-14 h-14 rounded-full bg-primary text-on-primary shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
      >
        <Icon name={open ? "close" : "chat"} size="26px" />
      </button>
    </div>
  );
}
