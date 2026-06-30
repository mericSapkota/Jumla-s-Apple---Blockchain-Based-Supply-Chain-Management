import axiosClient from "./axiosClient";

export const getMyProfile = () => axiosClient.get("/api/users/me");

export const updateProfile = (data) => axiosClient.put("/api/users/me", data);

export const changePassword = (data) => axiosClient.put("/api/users/me/password", data);
