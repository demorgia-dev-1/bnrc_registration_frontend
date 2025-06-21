import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import TestUserPanel from "./components/TestUserPanel";
import { AdminPanel } from "./components/AdminPanel";
import UserForm from "./components/UserForm";
import ThankYou from "./components/Thankyou";
import AllExamResults from "./components/AllExamResults";
import ProtectedRoute from "./components/ProtectedRoute"; // <-- new

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/test-user"
          element={
            <ProtectedRoute roleRequired="testuser">
              <TestUserPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-panel"
          element={
            <ProtectedRoute roleRequired="admin">
              <AdminPanel />
            </ProtectedRoute>
          }
        />

        {/* Open Routes */}
        <Route path="/user-form/:formId" element={<UserForm />} />
        <Route path="/pay/:submissionId" element={<UserForm />} />
        <Route path="/thankyou" element={<ThankYou />} />
        <Route path="/results" element={<AllExamResults />} />
      </Routes>
    </>
  );
}
