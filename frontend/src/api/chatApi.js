import axiosClient from "./axiosClient";

// ── Public chat widget ──────────────────────────────────────────────
export const getChatEnabled = () =>
  axiosClient.get("/api/chat/enabled").then((res) => res.data);

// Returns the assistant reply object when AI is on, or { status: "pending" }
// (HTTP 202) when AI is off and a human admin will answer instead.
export const sendChatMessage = (sessionId, message) =>
  axiosClient.post("/api/chat", { sessionId, message }).then((res) => res.data);

export const getChatHistory = (sessionId) =>
  axiosClient.get(`/api/chat/${sessionId}`).then((res) => res.data);

// ── Admin (SUPERADMIN) ──────────────────────────────────────────────
export const fetchConversations = () =>
  axiosClient.get("/api/admin/chat/conversations").then((res) => res.data);

export const fetchConversation = (sessionId) =>
  axiosClient.get(`/api/admin/chat/conversations/${sessionId}`).then((res) => res.data);

export const fetchChatSettings = () =>
  axiosClient.get("/api/admin/chat/settings").then((res) => res.data);

export const updateChatSettings = (enabled) =>
  axiosClient.put("/api/admin/chat/settings", { enabled }).then((res) => res.data);

// Human admin reply into a conversation (used when the AI is toggled off).
export const replyToConversation = (sessionId, message) =>
  axiosClient
    .post(`/api/admin/chat/conversations/${sessionId}/reply`, { message })
    .then((res) => res.data);
