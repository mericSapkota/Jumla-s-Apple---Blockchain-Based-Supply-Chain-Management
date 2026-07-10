import axiosClient from "./axiosClient";

// All endpoints require a SUPERADMIN JWT (axiosClient injects it).

export const fetchAnalytics = () => axiosClient.get("/api/admin/analytics").then((res) => res.data);

export const fetchUsers = ({ role, search } = {}) =>
  axiosClient.get("/api/admin/users", { params: { role: role || undefined, search: search || undefined } })
    .then((res) => res.data);

export const deleteUser = (id) => axiosClient.delete(`/api/admin/users/${id}`).then((res) => res.data);

export const verifyUser = (id) => axiosClient.put(`/api/admin/users/${id}/verify`).then((res) => res.data);

export const fetchAllBatches = () => axiosClient.get("/api/admin/batches").then((res) => res.data);

export const fetchAllDonations = () => axiosClient.get("/api/admin/donations").then((res) => res.data);

export const fetchAllBlogs = () => axiosClient.get("/api/admin/blogs").then((res) => res.data);

export const deleteBlog = (id) => axiosClient.delete(`/api/admin/blogs/${id}`).then((res) => res.data);
