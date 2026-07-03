import axiosClient from "./axiosClient";

/**
 * Register with multipart/form-data so the profile picture can be included
 * in the same request. The JSON payload is sent as a Blob part named "data";
 * the file (if any) goes in "profilePicture".
 */
export const registerUser = (payload, profilePictureFile = null) => {
  const formData = new FormData();
  // Send JSON as a Blob so Spring's @RequestPart("data") can deserialise it
  formData.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
  if (profilePictureFile) {
    formData.append("profilePicture", profilePictureFile);
  }
  return axiosClient
    .post("/api/auth/register", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data);
};

export const loginUser = (payload) => axiosClient.post("/api/auth/login", payload).then((res) => res.data);

/** Replace the logged-in user's profile picture. */
export const updateProfilePicture = (file) => {
  const formData = new FormData();
  formData.append("profilePicture", file);
  return axiosClient
    .put("/api/users/me/photo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data);
};
