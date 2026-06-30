import axiosClient from "./axiosClient";

export const registerUser = (payload) =>
  axiosClient.post("/api/auth/register", payload).then((res) => res.data);

export const loginUser = (payload) =>
  axiosClient.post("/api/auth/login", payload).then((res) => res.data);
