import React, { useState, useEffect } from "react";
import axios from "axios";
import API_BASE_URL from "../api/api";

const DisplaySubmissions = () => {
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/submissions`)
      .then((res) => setSubmissions(res.data))
      .catch((err) => console.error("Error:", err));
  }, []);

  return (
    <div>
      <h1>Submissions</h1>
      {submissions.map((submission, idx) => (
        <div key={idx} className="p-4 border mb-2">
          <pre>{JSON.stringify(submission, null, 2)}</pre>
        </div>
      ))}
    </div>
  );
};

export default DisplaySubmissions;
