// src/pages/GenerateAdmitCard.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../api/api";

const GenerateAdmitCard = () => {
  const { id } = useParams(); // assumes /generate-admit-card/:id route
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  if (!id) {
    console.error("No id param provided");
    setLoading(false);
    return;
  }
  
  axios
    .get(`${API_BASE_URL}/api/admit-card/generate-admit-card/${id}`)
    .then((res) => {
      setFormData(res.data.data);
      setLoading(false);
    }) 
    .catch((err) => {
      console.error("Error fetching admit card data:", err);
      setLoading(false);
    });
}, [id]);


  if (loading) return <p className="text-center">Loading Admit Card...</p>;

  if (!formData) return <p className="text-center text-red-500">Data not found.</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center">Admit Card</h2>
      <p><strong>Full Name:</strong> {formData.responses.first_name} {formData.responses.last_name}</p>
      <p><strong>DOB:</strong> {formData.responses.dob}</p>
      <p><strong>Registration No:</strong> {formData.responses.bnrc_registration_number}</p>
      {/* ... More fields here */}
    </div>
  );
};

export default GenerateAdmitCard; 
