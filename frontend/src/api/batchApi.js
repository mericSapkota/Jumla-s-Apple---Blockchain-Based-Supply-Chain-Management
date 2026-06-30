import axiosClient from "./axiosClient";

export const createBatch = (payload) =>
  axiosClient.post("/api/batch/create", payload).then((res) => res.data);

export const certifyBatch = (batchId) =>
  axiosClient.put(`/api/batch/certify/${batchId}`).then((res) => res.data);

export const updateTransit = (batchId, payload) =>
  axiosClient.put(`/api/batch/transit/${batchId}`, payload).then((res) => res.data);

export const deliverBatch = (batchId) =>
  axiosClient.put(`/api/batch/deliver/${batchId}`).then((res) => res.data);

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
