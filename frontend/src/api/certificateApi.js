import axiosClient from "./axiosClient";

export const getCertificateStatus = () => axiosClient.get("/api/certificate/status").then((res) => res.data);

/**
 * Triggers certificate generation on the backend and triggers a browser
 * download of the returned PDF blob.
 */
export const downloadCertificate = async () => {
  const response = await axiosClient.get("/api/certificate/generate", {
    responseType: "blob",
  });
  const url = URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "jumla-trace-certificate.pdf";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
