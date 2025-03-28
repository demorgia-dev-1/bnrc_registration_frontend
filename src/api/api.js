


// const API_BASE_URL = "http://localhost:5000/api/register"; // Adjust based on your backend

// // Register Candidate Function
// export const registerCandidate = async (formData) => {
//   console.log("🚀 Sending Data to Backend:", formData);

//   const formDataObj = new FormData();
//   for (const key in formData) {
//     if (formData[key] instanceof File) {
//       formDataObj.append(key, formData[key]); // ✅ Handle file uploads
//     } else {
//       formDataObj.append(key, formData[key]);
//     }
//   }

//   try {
//     const response = await axios.post(API_BASE_URL, formDataObj, {
//       headers: { "Content-Type": "multipart/form-data" },
//     });
//     return response.data;
//   } catch (error) {
//     console.error("❌ Registration Error:", error.response?.data || error.message);
//     throw error;
//   }
// };

import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/admin";  // ✅ Correct endpoint

export const loginAdmin = async (formData) => {
  const response = await axios.post(`${API_BASE_URL}/login`, formData);
  return response.data;
};

export const getAdminProfile = async (token) => {
  const response = await axios.get(`${API_BASE_URL}/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
