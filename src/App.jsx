import { Routes, Route, Navigate } from "react-router-dom";
import UserForm from "./components/UserForm";
import AdminPanel from "./components/AdminPanel";
import Login from "./components/Login";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CompletePayment from "./components/CompletePayment";

export default function App() {
  return (
    <>
      <ToastContainer position="top-right" />
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin-panel" element={<AdminPanel />} />
        <Route path="/user-form/:formId" element={<UserForm />} />
        <Route path="/complete-payment" element= {<CompletePayment />} />
      </Routes>
    </>
  );
}
