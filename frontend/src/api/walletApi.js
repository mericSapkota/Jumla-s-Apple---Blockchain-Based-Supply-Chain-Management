import axiosClient from "./axiosClient";

export const linkWallet = (payload) =>
  axiosClient.post("/api/users/me/wallet", payload).then((res) => res.data);

export const retryRoleAssignment = () =>
  axiosClient.post("/api/users/me/wallet/retry-role").then((res) => res.data);

export const getWalletStatus = () =>
  axiosClient.get("/api/users/me/wallet/status").then((res) => res.data);

export const unlinkWallet = () =>
  axiosClient.delete("/api/users/me/wallet").then((res) => res.data);
