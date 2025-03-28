import React, { useState, useEffect } from "react";
import axios from "axios";

const DisplaySubmissions = () => {
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/submissions")
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
