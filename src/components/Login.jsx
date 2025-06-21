import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api/api";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onHandleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/login`, {
        email,
        password,
      });

      sessionStorage.setItem("token", response.data.token);
      sessionStorage.setItem("role", response.data.role);
      sessionStorage.setItem("email", email);

      if (response.data.role === "testuser") {
        navigate("/test-user");
      } else if (response.data.role === "admin") {
        navigate("/admin-panel");
      } else {
        alert("Unknown role");
      }
    } catch (err) {
      console.log("Login error:", err);
      alert("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-300 via-white to-indigo-400 p-4 font-poppins">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
        {/* Logo & Welcome */}
        <div className="flex flex-col items-center mb-6">
          <img src="/demorgia-logo.jpg" alt="Logo" className=" h-16 mb-2" />
          <h2 className="text-2xl font-bold text-gray-800">Welcome Admin</h2>
          <p className="text-sm text-gray-500">Please sign in to continue</p>
        </div>

        {/* Form */}
        <form onSubmit={onHandleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="admin@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none shadow-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none shadow-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span
              className="absolute top-1/2 right-3  cursor-pointer text-gray-500 hover:text-gray-700"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                // Eye Off SVG
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.03 3.97a.75.75 0 011.06 0l11 11a.75.75 0 11-1.06 1.06l-1.503-1.502A8.717 8.717 0 0110 17.25c-4.418 0-8.25-3.182-9.743-7.5a9.007 9.007 0 012.906-3.783L4.03 3.97zM6.47 6.53A4.5 4.5 0 0113.47 13.53L6.47 6.53zM10 4.75c4.418 0 8.25 3.182 9.743 7.5a8.964 8.964 0 01-3.014 4.003l-1.073-1.073a6.963 6.963 0 002.17-2.93A7.49 7.49 0 0010 6.25a7.435 7.435 0 00-3.304.774l-1.08-1.08A8.925 8.925 0 0110 4.75z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                // Eye SVG
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 3c-3.866 0-7.125 2.772-8.493 6.5C2.875 13.228 6.134 16 10 16s7.125-2.772 8.493-6.5C17.125 5.772 13.866 3 10 3zM10 14.5c-2.486 0-4.5-2.014-4.5-4.5S7.514 5.5 10 5.5 14.5 7.514 14.5 10 12.486 14.5 10 14.5zm0-7a2.5 2.5 0 100 5 2.5 2.5 0 000-5z" />
                </svg>
              )}
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 text-white font-semibold rounded-md transition duration-300 ${
              loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Logging in...
              </span>
            ) : (
              "Login"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
