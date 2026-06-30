import axiosClient from "./axiosClient";

export const getBlogs = (page = 0, size = 9) =>
  axiosClient.get(`/api/blogs`, { params: { page, size } }).then((res) => res.data);

export const getBlog = (blogId) =>
  axiosClient.get(`/api/blogs/${blogId}`).then((res) => res.data);

export const createBlog = (payload) =>
  axiosClient.post(`/api/blogs`, payload).then((res) => res.data);

export const updateBlog = (blogId, payload) =>
  axiosClient.put(`/api/blogs/${blogId}`, payload).then((res) => res.data);

export const deleteBlog = (blogId) =>
  axiosClient.delete(`/api/blogs/${blogId}`).then((res) => res.data);

export const getMyBlogs = () =>
  axiosClient.get(`/api/blogs/my`).then((res) => res.data);
