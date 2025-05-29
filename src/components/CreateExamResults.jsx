// import React, { useState } from "react";
// import axios from "axios";
// import { API_BASE_URL } from "../api/api";

// export default function CreateResult() {
//   const [mobile, setMobile] = useState("");
//   const [regdNo, setRegdNo] = useState("");
//   const [candidateName, setcandidateName] = useState("");
//   const [examDate, setexamDate] = useState("");
//   const [grade, setGrade] = useState("");

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [success, setSuccess] = useState(null);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError(null);
//     setSuccess(null);

//     // Build the userData array in the format your API expects
//     const payload = {
//       userData: [
//         {
//           mobile,
//           regdNo,
//           certificate: [
//             {
//               candidateName,
//               examDate,
//               grade,
//             },
//           ],
//         },
//       ],
//     };

//     try {
//       const token = sessionStorage.getItem("token");

//       const response = await axios.post(
//         `${API_BASE_URL}/api/results/create`,
//         payload,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       setSuccess("Result created successfully!");
//       setMobile("");
//       setRegdNo("");
//       setcandidateName("");
//       setexamDate("");
//       setGrade("");
//     } catch (err) {
//       setError(err.response?.data?.message || "Error creating result");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
//       <h2 className="text-2xl font-semibold mb-6 text-center">
//         Create Exam Result
//       </h2>
//       <form onSubmit={handleSubmit} className="space-y-4">
//         <div>
//           <label className="block mb-1 font-medium text-gray-700">Mobile</label>
//           <input
//             type="text"
//             value={mobile}
//             onChange={(e) => setMobile(e.target.value)}
//             required
//             placeholder="Enter mobile number"
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>

//         <div>
//           <label className="block mb-1 font-medium text-gray-700">
//             Registration No
//           </label>
//           <input
//             type="text"
//             value={regdNo}
//             onChange={(e) => setRegdNo(e.target.value)}
//             placeholder="Enter registration no"
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>

//         <div>
//           <label className="block mb-1 font-medium text-gray-700">
//             Certificate Name
//           </label>
//           <input
//             type="text"
//             value={candidateName}
//             onChange={(e) => setcandidateName(e.target.value)}
//             placeholder="Certificate name"
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>

//         <div>
//           <label className="block mb-1 font-medium text-gray-700">
//             Completion Date
//           </label>
//           <input
//             type="date"
//             value={examDate}
//             onChange={(e) => setexamDate(e.target.value)}
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>

//         <div>
//           <label className="block mb-1 font-medium text-gray-700">Grade</label>
//           <input
//             type="text"
//             value={grade}
//             onChange={(e) => setGrade(e.target.value)}
//             placeholder="Grade (A, B, C, etc.)"
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>

//         <button
//           type="submit"
//           disabled={loading}
//           className={`w-full py-2 rounded-md text-white font-semibold ${
//             loading
//               ? "bg-gray-400 cursor-not-allowed"
//               : "bg-blue-600 hover:bg-blue-700"
//           }`}
//         >
//           {loading ? "Submitting..." : "Create Result"}
//         </button>

//         {error && <p className="text-red-600 mt-2 text-center">{error}</p>}
//         {success && (
//           <p className="text-green-600 mt-2 text-center">{success}</p>
//         )}
//       </form>
//     </div>
//   );
// }

import React, { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../api/api";

export default function CreateResult() {
  const [mobile, setMobile] = useState("");
  const [regdNo, setRegdNo] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [grade, setGrade] = useState("");

  const [file, setFile] = useState(null); // For file uploadyy

  const [loading, setLoading] = useState(false);
  const [fileUploadLoading, setFileUploadLoading] = useState(false);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [fileUploadSuccess, setFileUploadSuccess] = useState(null);
  const [generatingResult, setGeneratingResult] = useState(false);
  const [generateSuccess, setGenerateSuccess] = useState(null);
  const formData = new FormData();

  const fileInput = document.getElementById("fileInput");

  formData.append("yourFileFieldName", file);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const payload = {
      userData: [
        {
          mobile,
          regdNo,
          certificate: [
            {
              candidateName,
              examDate,
              grade,
            },
          ],
        },
      ],
    };

    try {
      const token = sessionStorage.getItem("token");

      await axios.post(`${API_BASE_URL}/api/results/create`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setSuccess("Result created successfully!");
      setMobile("");
      setRegdNo("");
      setCandidateName("");
      setExamDate("");
      setGrade("");
    } catch (err) {
      setError(err.response?.data?.message || "Error creating result");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      setFileUploadSuccess("Please select an Excel file.");
      return;
    }

    setFileUploadLoading(true);
    setFileUploadSuccess(null);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/upload/upload-certificate-data`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setFileUploadSuccess("File uploaded successfully and processed.");
    } catch (err) {
      setError(err.response?.data?.error || "Error uploading file.");
    } finally {
      setFileUploadLoading(false);
    }
  };

  const handleGenerateResult = async () => {
    setGeneratingResult(true);
    setGenerateSuccess(null);
    setError(null);

    try {
      const token = sessionStorage.getItem("token");

      const res = await axios.post(
        `${API_BASE_URL}/api/results/generate-from-uploaded-data`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setGenerateSuccess(res.data.message || "Results generated successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Error generating results.");
    } finally {
      setGeneratingResult(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium text-gray-700">Mobile</label>
          <input
            type="text"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            required
            placeholder="Enter mobile number"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium text-gray-700">
            Registration No
          </label>
          <input
            type="text"
            value={regdNo}
            onChange={(e) => setRegdNo(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Enter registration no"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium text-gray-700">
            Candidate Name
          </label>
          <input
            type="text"
            value={candidateName}
            onChange={(e) => setCandidateName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Candidate name"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium text-gray-700">
            Exam Date
          </label>
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium text-gray-700">
            percentage Of Marks
          </label>
          <input
            type="text"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Enter the percentage of marks (e.g. 85%)"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded-md text-white font-semibold ${
            loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Submitting..." : "Create Result"}
        </button>
      </form>
      <div className="border-t my-6"></div>

      <h3 className="text-lg font-semibold mb-2 text-center">
        Or Upload Excel File
      </h3>

      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={(e) => setFile(e.target.files[0])}
        className="mb-4"
      />

      <button
        onClick={handleFileUpload}
        disabled={fileUploadLoading}
        className={`w-full py-2 rounded-md text-white font-semibold ${
          fileUploadLoading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {fileUploadLoading ? "Uploading..." : "Upload File"}
      </button>

      {/* Show generate button ONLY if upload succeeded */}
      {fileUploadSuccess && (
        <button
          onClick={handleGenerateResult}
          disabled={generatingResult}
          className={`w-full mt-4 py-2 rounded-md text-white font-semibold ${
            generatingResult ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {generatingResult ? "Generating Results..." : "Generate Result"}
        </button>
      )}

      {/* Feedback */}
      {error && <p className="text-red-600 mt-2 text-center">{error}</p>}
      {fileUploadSuccess && (
        <p className="text-green-600 mt-2 text-center">{fileUploadSuccess}</p>
      )}
      {generateSuccess && (
        <p className="text-green-600 mt-2 text-center">{generateSuccess}</p>
      )}
    </div>
  );
}
