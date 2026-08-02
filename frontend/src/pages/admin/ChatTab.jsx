import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import Icon from "../../components/ui/Icon";
import { formatDate } from "../../utils/formatDate";
import {
  fetchConversations,
  fetchConversation,
  fetchChatSettings,
  updateChatSettings,
  replyToConversation,
} from "../../api/chatApi";

const ROLE_LABELS = { user: "Visitor", assistant: "Assistant (AI)", admin: "You" };

export default function ChatTab() {
  const [settings, setSettings] = useState(null); // { enabled, aiConfigured }
  const [conversations, setConversations] = useState(null);
  const [selected, setSelected] = useState(null); // sessionId
  const [thread, setThread] = useState(null);
  const [toggling, setToggling] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const selectedRef = useRef(null);

  const loadConversations = useCallback(() => {
    fetchConversations()
      .then(setConversations)
      .catch(() => toast.error("Could not load conversations"));
  }, []);

  useEffect(() => {
    fetchChatSettings()
      .then(setSettings)
      .catch(() => toast.error("Could not load chat settings"));
    loadConversations();
  }, [loadConversations]);

  const openConversation = (sessionId) => {
    setSelected(sessionId);
    selectedRef.current = sessionId;
    setThread(null);
    setReplyText("");
    fetchConversation(sessionId)
      .then(setThread)
      .catch(() => toast.error("Could not load this conversation"));
  };

  // Poll the open conversation so new visitor messages appear while the admin
  // is answering (mirrors the visitor widget's polling).
  useEffect(() => {
    if (!selected) return;
    const id = setInterval(() => {
      if (replying) return;
      fetchConversation(selected).then(setThread).catch(() => {});
    }, 4000);
    return () => clearInterval(id);
  }, [selected, replying]);

  const handleReply = async (e) => {
    e.preventDefault();
    const text = replyText.trim();
    if (!text || replying || !selected) return;
    setReplying(true);
    try {
      const saved = await replyToConversation(selected, text);
      setThread((prev) => [...(prev || []), saved]);
      setReplyText("");
      loadConversations(); // refresh the list preview/timestamp
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not send reply");
    } finally {
      setReplying(false);
    }
  };

  const handleToggle = async () => {
    if (!settings) return;
    setToggling(true);
    try {
      const updated = await updateChatSettings(!settings.enabled);
      setSettings(updated);
      toast.success(updated.enabled ? "AI chat turned on" : "AI chat turned off");
    } catch {
      toast.error("Could not update the setting");
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Superadmin
          </p>
          <h1 className="font-headline text-3xl font-bold text-on-surface">AI Chat</h1>
        </div>

        {/* On/off toggle */}
        {settings && (
          <div className="flex items-center gap-3 bg-surface-container-lowest rounded-2xl px-4 py-3 shadow-card">
            <div className="text-right">
              <p className="text-sm font-bold text-on-surface">
                Assistant is {settings.enabled ? "on" : "off"}
              </p>
              {!settings.aiConfigured && (
                <p className="text-[11px] text-error">No API key — using fallback replies</p>
              )}
            </div>
            <button
              onClick={handleToggle}
              disabled={toggling}
              role="switch"
              aria-checked={settings.enabled}
              className={`relative w-14 h-8 rounded-full transition-colors disabled:opacity-50 ${
                settings.enabled ? "bg-primary" : "bg-outline"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                  settings.enabled ? "translate-x-6" : ""
                }`}
              />
            </button>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
        {/* Conversation list */}
        <div className="bg-surface-container-lowest rounded-3xl shadow-card p-3 h-[65vh] overflow-y-auto">
          {conversations === null ? (
            <p className="text-on-surface-variant text-sm p-3">Loading…</p>
          ) : conversations.length === 0 ? (
            <p className="text-on-surface-variant text-sm p-3">No conversations yet.</p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.sessionId}
                onClick={() => openConversation(c.sessionId)}
                className={`w-full text-left rounded-2xl px-4 py-3 mb-1 transition-colors ${
                  selected === c.sessionId
                    ? "bg-primary/10"
                    : "hover:bg-surface-container-high"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-on-surface truncate">
                    {c.userEmail || "Anonymous visitor"}
                  </p>
                  <span className="text-[10px] text-on-surface-variant shrink-0">
                    {c.messageCount} msg
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant truncate">{c.lastMessage}</p>
                <p className="text-[10px] text-outline mt-0.5">{formatDate(c.updatedAt)}</p>
              </button>
            ))
          )}
        </div>

        {/* Transcript + reply composer */}
        <div className="bg-surface-container-lowest rounded-3xl shadow-card h-[65vh] flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant gap-2">
              <Icon name="forum" className="text-5xl" />
              <p className="text-sm">Select a conversation to read the transcript.</p>
            </div>
          ) : thread === null ? (
            <p className="text-on-surface-variant text-sm p-5">Loading…</p>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {thread.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words ${
                        m.role === "user"
                          ? "bg-primary text-on-primary rounded-br-sm"
                          : m.role === "admin"
                          ? "bg-secondary-container text-on-secondary-container rounded-bl-sm"
                          : "bg-surface-container-high text-on-surface rounded-bl-sm"
                      }`}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wide opacity-70 mb-0.5">
                        {ROLE_LABELS[m.role] || m.role}
                      </p>
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply composer — only when the AI is turned off */}
              {settings && !settings.enabled ? (
                <form
                  onSubmit={handleReply}
                  className="p-3 border-t border-outline-variant/20 flex items-center gap-2"
                >
                  <input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply…"
                    className="flex-1 bg-surface-container-low border-none rounded-full px-4 py-2.5 text-sm text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary-fixed outline-none"
                  />
                  <button
                    type="submit"
                    disabled={replying || !replyText.trim()}
                    aria-label="Send reply"
                    className="w-10 h-10 shrink-0 rounded-full bg-primary text-on-primary flex items-center justify-center disabled:opacity-40"
                  >
                    <Icon name="send" size="20px" />
                  </button>
                </form>
              ) : (
                <div className="p-3 border-t border-outline-variant/20 text-center text-[11px] text-on-surface-variant">
                  Turn off the AI assistant (toggle above) to reply to this visitor yourself.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
