// src/components/ProtectedRoute.js
import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, roleRequired }) => {
  const role = sessionStorage.getItem("role");

  if (role === roleRequired) {
    return children;
  }

  return <Navigate to="/login" />;
};

export default ProtectedRoute;
