import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_NODE_ENV === "production"
    ? "https://api.demorgia.com"
    : "http://localhost:5000";
console.log("api base url", API_BASE_URL);

export const loginAdmin = async (formData) => {
  const response = await axios.post(
    `${API_BASE_URL}/api/admin/login`,
    formData
  );
  return response.data;
};

export const getAdminProfile = async (token) => {
  const response = await axios.get(`${API_BASE_URL}/api/admin/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
