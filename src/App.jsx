import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import UserForm from "./components/UserForm";
import AdminPanel from "./components/AdminPanel";

export default function App() {
  return (
      <Routes>
        <Route path="/" element={<AdminPanel />} />
        <Route path="/user-form/:formId" element={<UserForm />} />
      </Routes>
  );
}
