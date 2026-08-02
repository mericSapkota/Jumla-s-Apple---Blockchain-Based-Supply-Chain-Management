import axiosClient from "./axiosClient";

// NOTE: create/certify/transit/deliver/ipfs calls below all expect the
// on-chain transaction to have ALREADY been sent (and mined) by the user's
// own MetaMask wallet — see src/blockchain/batchContract.js. These endpoints
// just verify the tx hash and mirror the resulting chain state into
// Postgres. See the dashboards for the full connect-wallet -> sign tx ->
// persist flow.

export const getNextBatchId = () =>
  axiosClient.get("/api/batch/next-id").then((res) => res.data.batchId);

export const createBatch = (payload) =>
  axiosClient.post("/api/batch/create", payload).then((res) => res.data);

// Uploads the AI-verified apple photo and returns its stored relative path
// (e.g. "/uploads/batches/<uuid>.jpg"), which is then passed to createBatch.
export const uploadBatchPhoto = (file) => {
  const formData = new FormData();
  formData.append("photo", file);
  return axiosClient
    .post("/api/batch/photo", formData, { headers: { "Content-Type": "multipart/form-data" } })
    .then((res) => res.data.path);
};

export const certifyBatch = (batchId, payload) =>
  axiosClient.put(`/api/batch/certify/${batchId}`, payload).then((res) => res.data);

export const updateTransit = (batchId, payload) =>
  axiosClient.put(`/api/batch/transit/${batchId}`, payload).then((res) => res.data);

export const deliverBatch = (batchId, payload) =>
  axiosClient.put(`/api/batch/deliver/${batchId}`, payload).then((res) => res.data);

export const updateIpfs = (batchId, payload) =>
  axiosClient.put(`/api/batch/ipfs/${batchId}`, payload).then((res) => res.data);

export const getBatch = (batchId) =>
  axiosClient.get(`/api/batch/${batchId}`).then((res) => res.data);

export const getMyBatches = () =>
  axiosClient.get(`/api/batch/my/batches`).then((res) => res.data);

export const getBatchesByStatus = (status) =>
  axiosClient.get(`/api/batch/status/${status}`).then((res) => res.data);

const ALL_STATUSES = ["HARVESTED", "CERTIFIED", "IN_TRANSIT", "DELIVERED"];

// No single "get all batches" endpoint exists on the backend, so this
// fans out across every status and merges the results. Used by the
// Batch History page for cooperative/transporter/consumer-style views.
export const getAllBatchesAcrossStatuses = async () => {
  const results = await Promise.all(ALL_STATUSES.map((s) => getBatchesByStatus(s).catch(() => [])));
  return results.flat();
};

export const getQrUrl = (batchId) =>
  `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/api/batch/qr/${batchId}`;
