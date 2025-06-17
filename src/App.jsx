import { Routes, Route, Navigate } from "react-router-dom";
import UserForm from "./components/UserForm";
import { AdminPanel } from "./components/AdminPanel";
import Login from "./components/Login";
import { ToastContainer } from "react-toastify";
import TestUserPanel from "./components/TestUserPanel";
import "react-toastify/dist/ReactToastify.css";
import ThankYou from "./components/Thankyou";
import AllExamResults from "./components/AllExamResults";

export default function App() {
  const email = sessionStorage.getItem("email");

  return (
    <>
      <ToastContainer position="top-right" />

      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />

        {/* Test User route */}
        <Route
          path="/test-user"
          element={
            email === "testuser@gmail.com" ? (
              <TestUserPanel />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Admin Panel route */}
        <Route
          path="/admin-panel"
          element={
            email !== "testuser@gmail.com" ? (
              <AdminPanel />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route path="/user-form/:formId" element={<UserForm />} />
        <Route path="/pay/:submissionId" element={<UserForm />} />
        <Route path="/thankyou" element={<ThankYou />} />
        <Route path="/results" element={<AllExamResults />} />
      </Routes>
    </>
  );
}
