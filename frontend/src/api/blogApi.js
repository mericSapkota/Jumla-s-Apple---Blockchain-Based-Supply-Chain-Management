import axiosClient from "./axiosClient";

export const getBlogs = (page = 0, size = 9) =>
  axiosClient.get(`/api/blogs`, { params: { page, size } }).then((res) => res.data);

export const getBlog = (blogId) =>
  axiosClient.get(`/api/blogs/${blogId}`).then((res) => res.data);

/**
 * Create a post with multipart/form-data so the cover image can be uploaded
 * directly. The text fields go in a JSON "data" part; the image (if any) in
 * "coverImage".
 */
export const createBlog = (payload, coverImageFile = null) => {
  const formData = new FormData();
  formData.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
  if (coverImageFile) {
    formData.append("coverImage", coverImageFile);
  }
  return axiosClient
    .post(`/api/blogs`, formData, { headers: { "Content-Type": "multipart/form-data" } })
    .then((res) => res.data);
};

export const updateBlog = (blogId, payload, coverImageFile = null) => {
  const formData = new FormData();
  formData.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
  if (coverImageFile) {
    formData.append("coverImage", coverImageFile);
  }
  return axiosClient
    .put(`/api/blogs/${blogId}`, formData, { headers: { "Content-Type": "multipart/form-data" } })
    .then((res) => res.data);
};

export const deleteBlog = (blogId) =>
  axiosClient.delete(`/api/blogs/${blogId}`).then((res) => res.data);

export const getMyBlogs = () =>
  axiosClient.get(`/api/blogs/my`).then((res) => res.data);
