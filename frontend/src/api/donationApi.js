import axiosClient from "./axiosClient";

/**
 * Ask the backend for a signed eSewa form. Returns { formUrl, fields } —
 * the caller builds a hidden <form> with those fields and POSTs it, which
 * redirects the browser to eSewa's payment page.
 */
export const initiateDonation = (payload) =>
  axiosClient.post("/api/donations/initiate", payload).then((res) => res.data);

/** Build and submit the eSewa redirect form. Never returns (page navigates away). */
export const redirectToEsewa = ({ formUrl, fields }) => {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = formUrl;

  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
};
