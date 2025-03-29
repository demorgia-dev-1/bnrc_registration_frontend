import { Routes, Route, Navigate } from "react-router-dom";
import UserForm from "./components/UserForm";
import AdminPanel from "./components/AdminPanel";
import Login from "./components/Login";

export default function App() {

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route
        path="/login"
        element={
          <Login />
        }
      />
      <Route
        path="/admin-panel"
        element={ <AdminPanel />}
      />
      <Route path="/user-form/:formId" element={<UserForm />} />
    </Routes>
  );
}
