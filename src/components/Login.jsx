import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api/api";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onHandleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/login`, {
        email,
        password,
      });
      console.log("response", response);
      sessionStorage.setItem("token", response.data.token);
      sessionStorage.setItem("role", response.data.role);
       sessionStorage.setItem("email", email); 

       if (email === "testuser@gmail.com") {
      navigate("/test-user");
    } else {
      navigate("/admin-panel");
    }
      // navigate("/admin-panel");
    } catch (err) {
      console.log("Login error:", err);
      alert("Invalid credentials");
    }
  };

  return (
    <div className="relative min-h-screen">
      <img
        src="/formpm.jpg"
        alt="form"
        className="w-full h-full object-cover absolute inset-0"
      />
      <div className="absolute inset-0 flex items-center justify-center z-10 w-full">
        <form
          onSubmit={onHandleSubmit}
          className="bg-opacity-95 p-12 rounded-lg shadow-lg w-full max-w-[50%] max-h-[80vh] overflow-y-auto form bg-sky-50"
        >
          <h1 className="text-center font-bold text-2xl capitalize">
            Admin Login
          </h1>
          <label>Admin Id</label>
          <input
            type="text"
            placeholder="Enter your Email"
            className="border border-2 p-2 w-full rounded focus:border-none focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-md w-1/2 mb-4"
            onChange={(e) => setEmail(e.target.value)}
          />
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            className="border border-2 p-2 w-full rounded focus:border-none focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-md w-1/2 "
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 mt-4"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
