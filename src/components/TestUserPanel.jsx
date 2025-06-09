import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../api/api";

import { useNavigate } from "react-router-dom";
// import CreateResult from "./CreateExamResults";

const Modal = ({ show, onClose, data, children }) => {
  const [previewImage, setPreviewImage] = useState(null);

  if (!show) return null;

  // const formFields = data?.form?.fields || [];
  const formFields = (data?.form?.sections || []).flatMap(
    (section) => section.fields || []
  );
  const responseMap = data?.responses || {};
  const uploadedFiles = data?.uploadedFiles || [];

  const fileMap = {};
  uploadedFiles.forEach((file) => {
    if (!fileMap[file.fieldName]) fileMap[file.fieldName] = [];
    fileMap[file.fieldName].push(file);
  });

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center">
        <div className="bg-white rounded-lg shadow-xl w-11/12 md:w-4/5 lg:w-2/3 max-h-[90vh] overflow-y-auto p-6">
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-bold mb-4">{data?.form?.formName}</h2>

            <button
              onClick={onClose}
              className="text-red-600 text-2xl font-bold cursor-pointer "
            >
              ×
            </button>
          </div>

          {data?.form ? (
            <table className="w-full border border-gray-300 mb-4">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">Field</th>
                  <th className="p-2 border">Response</th>
                </tr>
              </thead>
              <tbody>
                {formFields.map((field) => {
                  const value = responseMap[field.name];
                  const files = fileMap[field.name];
                  return (
                    <tr key={field.name}>
                      <td className="border p-2">{field.label}</td>
                      <td className="border p-2">
                        {value && typeof value === "string" && (
                          <div className="mb-2">{value}</div>
                        )}
                        {files?.length > 0 && (
                          <div className="flex gap-3 flex-wrap">
                            {files.map((file, idx) => {
                              const fileUrl = `${API_BASE_URL}/api/download/${file._id}`;
                              const isPdf = file.originalName
                                ?.toLowerCase()
                                .endsWith(".pdf");
                              return isPdf ? (
                                <button
                                  key={idx}
                                  onClick={() => window.open(fileUrl)}
                                  className="w-32 h-32 border rounded flex flex-col items-center justify-center cursor-pointer bg-gray-100 text-gray-700 p-2 text-center"
                                  title="Open PDF in new tab"
                                >
                                  <span className="text-4xl mb-1">📄</span>
                                  <span className="truncate w-full">
                                    {file.fieldName}
                                  </span>
                                </button>
                              ) : (
                                <img
                                  key={idx}
                                  src={fileUrl}
                                  alt={file.originalName || "Uploaded file"}
                                  className="w-32 h-32 object-cover border rounded cursor-pointer"
                                  onClick={() => setPreviewImage(fileUrl)}
                                />
                              );
                            })}
                          </div>
                        )}
                        {!value && (!files || files.length === 0) && "N/A"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            children
          )}
        </div>
      </div>

      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center">
          <div className="relative ">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 text-white bg-black bg-opacity-50 hover:bg-opacity-80 rounded-full text-xl px-3 py-1 cursor-pointer"
              title="Close Preview"
            >
              ×
            </button>
            {previewImage.toLowerCase().endsWith(".pdf") ? (
              <iframe
                src={previewImage}
                title="PDF Preview"
                className="w-full h-[90vh]"
              />
            ) : (
              <img
                src={previewImage}
                alt="Full Preview"
                className="max-w-full max-h-[90vh] rounded-lg"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};

function TestUserPanel() {
  const [forms, setForms] = useState([]);
  const [selectedFormId, setSelectedFormId] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [showListModal, setShowListModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [examDates, setExamDates] = useState([]);
  const [selectedExamDate, setSelectedExamDate] = useState("");

  const navigate = useNavigate();

  const staticExamDates = [
    "2025-06-13",
    "2025-06-14",
    "2025-06-16",
    "2025-06-17",
    "2025-06-20",
    "2025-06-21",
    "2025-06-23",
    "2025-06-24",
    "2025-06-27",
    "2025-06-28",
    "2025-06-30",
    "2025-07-01",
    "2025-07-04",
    "2025-07-05",
    "2025-07-07",
    "2025-07-08",
    "2025-07-11",
    "2025-07-12",
    "2025-07-14",
    "2025-07-15",
    "2025-07-18",
    "2025-07-19",
    "2025-07-21",
    "2025-07-22",
    "2025-07-25",
    "2025-07-26",
    "2025-07-28",
    "2025-07-29",
  ];

  const handleLogout = () => { 
    sessionStorage.clear();
    navigate("/login");
  };

  const handleVerificationToggle = async (submissionId, currentStatus) => {
    try {
      const token = sessionStorage.getItem("token");
      await axios.patch(
        `${API_BASE_URL}/api/submissions/${submissionId}/verify`,
        { verified: !currentStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // update local state
      setFilteredSubmissions((prev) =>
        prev.map((s) =>
          s._id === submissionId ? { ...s, verified: !s.verified } : s
        )
      );
    } catch (error) {
      console.error("Error updating verification:", error);
      alert("Error updating verification status");
    }
  };

  const currentUser = JSON.parse(sessionStorage.getItem("user"));

  useEffect(() => {
    if (!selectedFormId) return;

    async function fetchExamDates() {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/forms/${selectedFormId}/exam-dates`
        );
        setExamDates(
          res.data.examDates.sort((a, b) => new Date(a) - new Date(b))
        );
      } catch (e) {
        console.error(e);
      }
    }

    fetchExamDates();
  }, [selectedFormId]);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/api/forms`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setForms(res.data);
      } catch (error) {
        console.error("Failed to fetch forms", error);
      }
    };
    fetchForms();
  }, []);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/api/submissions`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUploadedFiles(res.data.submissions);
      } catch (err) {
        console.error("Error fetching submissions:", err);
      }
    };

    fetchSubmissions();
  }, []);

  useEffect(() => {
    if (!selectedFormId) return;

    const fetchSubmissions = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/api/submissions`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Filter submissions for this form AND user email
        const filtered = res.data.submissions.filter(
          (sub) =>
            sub.form?._id === selectedFormId &&
            sub.responses?.email === currentUser?.email
        );

        setSubmissions(filtered);
      } catch (error) {
        console.error("Failed to fetch submissions", error);
      }
    };
    fetchSubmissions();
  }, [selectedFormId, currentUser]);

  useEffect(() => {
    const enhanced = submissions.map((s) => ({
      ...s,
      verified: s.verified || false,
    }));

    const filtered = selectedExamDate
      ? enhanced.filter(
          (s) =>
            s.responses?.exam_date_selection &&
            s.responses.exam_date_selection === selectedExamDate
        )
      : enhanced;

    setFilteredSubmissions(filtered);
  }, [submissions, selectedFormId, selectedExamDate]);

  const downloadSubmissionExcel = async (formId, examDate) => {
    try {
      const token = sessionStorage.getItem("token");

      const url = new URL(`${API_BASE_URL}/api/download/submissions-excel`);
      url.searchParams.append("formId", formId);
      if (examDate) {
        url.searchParams.append("examDate", examDate);
      }

      const response = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to download Excel");

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `submissions-${formId}${
        examDate ? `-${examDate}` : ""
      }.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download submissions.");
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-tr from-blue-50 via-white to-blue-100">
      <img
        src="/background.jpg"
        alt="Background"
        className="w-full h-full object-cover absolute inset-0 opacity-20"
      />
      <div className="absolute top-0 h-full flex flex-col items-center gap-4 justify-center z-10 w-full px-4">
        <div className="mt-5 p-8 rounded-lg flex flex-col flex-wrap justify-between gap-8 bg-white bg-opacity-90 shadow-2xl max-w-5xl w-full">
          <h1 className="text-3xl font-extrabold text-blue-900 text-center drop-shadow-md ">
            Competency Certification Verification Panel
          </h1>
          <div className="flex gap-8 items-center">
            <div className="flex flex-wrap justify-center gap-4 items-center">
              {/* Form Selector */}
              <select
                id="formSelect"
                value={selectedFormId}
                onChange={(e) => setSelectedFormId(e.target.value)}
                className="cursor-pointer rounded-lg border border-blue-300 px-4 py-3 text-lg font-semibold text-blue-900 shadow-md hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Select a form</option>
                {forms.map((form) => (
                  <option key={form._id} value={form._id}>
                    {form.formName}
                  </option>
                ))}
              </select>

              {/* Static Exam Date Filter */}
              {submissions.length > 0 && (
                <select
                  id="dateFilter"
                  value={selectedExamDate}
                  onChange={(e) => setSelectedExamDate(e.target.value)}
                className="cursor-pointer rounded-lg border border-blue-300 px-4 py-3 text-lg font-semibold text-blue-900 shadow-md hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Select Exam Date</option>
                  {staticExamDates.map((date) => (
                    <option key={date} value={date}>
                      {date}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex gap-8 items-center">
              <button
                onClick={() => setShowListModal(true)}
                disabled={!selectedFormId}
                className={`rounded-lg px-6 py-3 font-semibold text-white shadow-lg transition duration-300 cursor-pointer ${
                  selectedFormId
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-blue-300 cursor-not-allowed"
                }`}
              >
                Show Submissions
              </button>
              <button
                className={`rounded-lg px-6 py-3 font-semibold shadow-lg transition duration-300 cursor-pointer ${
                  selectedFormId
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-green-300 text-green-100 cursor-not-allowed"
                }`}
                onClick={() =>
                  downloadSubmissionExcel(selectedFormId, selectedExamDate)
                }
                disabled={!selectedFormId}
              >
                Download Submissions Excel
              </button>
              <button
                onClick={handleLogout}
                className="rounded-lg px-6 py-3 font-semibold text-white bg-red-600 shadow-lg hover:bg-red-700 transition duration-300 cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Show All Submissions Modal */}
          <Modal show={showListModal} onClose={() => setShowListModal(false)}>
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold mb-4">
                {forms.find((f) => f._id === selectedFormId)?.formName ||
                  "selected form"}
              </h2>
            </div>

            <table className="min-w-full border border-gray-300">
              <thead>
                <tr className="bg-gray-200 text-left">
                  <th className="p-2 border">Candidate</th>
                  <th className="p-2 border">BNRC Registration</th>
                  {/* <th className="p-2 border">Submission ID</th> */}
                  <th className="p-2 border">Files</th>
                  <th className="p-2 border">Action</th>
                  <th className="p-2 border">Verification</th>
                </tr>
              </thead>
              <tbody>
                {!selectedFormId ? (
                  <tr>
                    <td colSpan="4" className="text-center p-4 text-gray-500">
                      Please select a form to view submissions.
                    </td>
                  </tr>
                ) : filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center p-4 text-gray-500">
                      No submissions found for this form.
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((submission) => (
                    <tr key={submission._id} className="hover:bg-gray-50">
                      <td className="p-2 border">
                        {(() => {
                          {
                            /* const formFields = submission.form?.fields || []; */
                          }
                          const formFields =
                            submission.form?.sections?.flatMap(
                              (section) => section.fields
                            ) || [];
                          const candidateField = formFields.find(
                            (f) =>
                              f.label.toLowerCase().includes("name") ||
                              f.name.toLowerCase().includes("name")
                          );
                          const candidateKey = candidateField?.name;
                          return candidateKey
                            ? submission.responses?.[candidateKey] || "N/A"
                            : "N/A";
                        })()}
                      </td>
                      <td className="p-2 border">
                        {(() => {
                          const formFields =
                            submission.form?.sections?.flatMap(
                              (section) => section.fields
                            ) || [];
                          const bnrcField = formFields.find(
                            (f) =>
                              f.label.toLowerCase().includes("bnrc") ||
                              f.name.toLowerCase().includes("bnrc")
                          );
                          const bnrcKey = bnrcField?.name;
                          return bnrcKey
                            ? submission.responses?.[bnrcKey] || "N/A"
                            : "N/A";
                        })()}
                      </td>
                      {/* <td className="p-2 border">{submission._id}</td> */}
                      <td className="p-2 border">
                        {submission.uploadedFiles?.length > 0
                          ? `${submission.uploadedFiles.length} files`
                          : "No File"}
                      </td>

                      <td className="p-2 border">
                        <button
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setShowDetailModal(true);
                          }}
                          className="py-1 px-4 bg-green-500 text-white cursor-pointer rounded-lg shadow-lg hover:bg-green-600"
                        >
                          View
                        </button>
                      </td>
                      <td className="p-2 border">
                        <button
                          className={`py-1 px-4 rounded-lg cursor-pointer shadow-lg ${
                            submission.verified
                              ? "bg-green-600 cursor-not-allowed opacity-70"
                              : "bg-red-600"
                          } text-white`}
                          onClick={() =>
                            handleVerificationToggle(
                              submission._id,
                              submission.verified
                            )
                          }
                          disabled={submission.verified} // disable if verified
                        >
                          {submission.verified ? "Verified" : "Not Verified"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Modal>

          {/* Detail Modal (Single Submission) */}
          <Modal
            show={showDetailModal}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedSubmission(null);
            }}
            data={selectedSubmission}
          >
            {selectedSubmission ? (
              <div className="p-4">
                <h2 className="text-xl font-bold mb-4">Submission Details</h2>
                <p>
                  <strong>ID:</strong> {selectedSubmission._id}
                </p>
                <p>
                  <strong>Candidate Name:</strong>{" "}
                  {selectedSubmission.responses?.candidateName || "N/A"}
                </p>
                <p>
                  <strong>Files:</strong>{" "}
                  {selectedSubmission.uploadedFiles?.length > 0
                    ? selectedSubmission.uploadedFiles
                        .map((file) => file.originalName)
                        .join(", ")
                    : "No File"}
                </p>
              </div>
            ) : (
              <p>No submission selected.</p>
            )}
          </Modal>
        </div>
      </div>
    </div>
  );
}

export default TestUserPanel;
