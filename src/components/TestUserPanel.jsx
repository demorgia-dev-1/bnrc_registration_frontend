import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../api/api";

import { useNavigate } from "react-router-dom";

const Modal = ({ show, onClose, data, children }) => {
  const [previewImage, setPreviewImage] = useState(null);

  if (!show) return null;

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
                          <div className="mb-2">
                            {field.name === "_years_of_experience" &&
                            responseMap["_years_of_experience_unit"]
                              ? `${value} ${responseMap["_years_of_experience_unit"]}`
                              : value}
                          </div>
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
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const navigate = useNavigate();

  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
  const paginatedSubmissions = filteredSubmissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const staticExamDates = (() => {
    const allowedDays = [1, 2, 5, 6]; // Mon, Tue, Fri, Sat
    const start = new Date("2025-06-01");
    const end = new Date("2025-07-31");
    const todayStr = new Date().toISOString().split("T")[0];
    const result = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];

      if (
        dateStr === "2025-06-13" ||
        (dateStr >= "2025-06-25" && dateStr <= "2025-07-03")
        // ⛔ Removed: || dateStr === todayStr
      ) {
        continue;
      }

      if (allowedDays.includes(d.getDay())) {
        result.push(new Date(d));
      }
    }

    // Add manually specified August dates
    const extraAugustDates = [
      "2025-08-01", // Friday
      "2025-08-05", // Tuesday
      "2025-08-08", // Friday
      "2025-08-12", // Tuesday
      "2025-08-13", // Wednesday
      "2025-08-19", // Tuesday
      "2025-08-22", // Friday
      "2025-08-26", // Tuesday
      "2025-08-29", // Friday
    ];

    extraAugustDates.forEach((dateStr) => {
      result.push(new Date(dateStr));
    });

    const extraSeptemberDates = [
      "2025-09-02", // Tuesday
      "2025-09-04", // Thursday special
      "2025-09-09", // Tuesday
      "2025-09-12", // Friday
      "2025-09-16", // Tuesday
      "2025-09-19", // Friday
      "2025-09-23", // Tuesday
      "2025-09-26", // Friday
      "2025-09-30", // Tuesday
    ];

    extraSeptemberDates.forEach((dateStr) => {
      result.push(new Date(dateStr));
    });

    const extraOctoberDates = [
      "2025-10-14", // Friday
      "2025-10-17", // Friday
      "2025-10-29", // Tuesday
      "2025-10-30", // Friday
    ];
    extraOctoberDates.forEach((dateStr) => {
      result.push(new Date(dateStr));
    });

    const extraNovemberDates = [
      "2025-11-18", // Tuesday
      "2025-11-19", // Wednesday
      "2025-11-26", // Tuesday
      "2025-11-27", // Wednesday
    ];
    extraNovemberDates.forEach((dateStr) => {
      result.push(new Date(dateStr));
    });

    const extraDecemberDates = [
      "2025-12-03", // Tuesday
      "2025-12-04", // Wednesday
      "2025-12-09", // Tuesday
      "2025-12-10", // Wednesday
      "2025-12-17", // Wednesday
      "2025-12-18", // Thursday
      "2025-12-23", // Tuesday
      "2025-12-24", // Wednesday
      "2025-12-29", // Tuesday
      "2025-12-30", // Wednesday
    ];
    extraDecemberDates.forEach((dateStr) => {
      result.push(new Date(dateStr));
    });

    const extraJanuaryDates = [
      "2026-01-07", // Wednesday
      "2026-01-09", // Tuesday
      "2026-01-12", // Wednesday
      "2026-01-22", // Tuesday
      "2026-01-27", // Tuesday
    ];
    extraJanuaryDates.forEach((dateStr) => {
      result.push(new Date(dateStr));
    });
    return result;
  })();

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

    const filtered = enhanced.filter((s) => {
      const matchesExamDate =
        !selectedExamDate ||
        s.responses?.exam_date_selection === selectedExamDate;

      const matchesPaymentStatus =
        !selectedPaymentStatus || s.paymentStatus === selectedPaymentStatus;

      return matchesExamDate && matchesPaymentStatus;
    });

    setFilteredSubmissions(filtered);
  }, [submissions, selectedFormId, selectedExamDate, selectedPaymentStatus]);

  const downloadSubmissionExcel = async (formId, examDate, paymentStatus) => {
    try {
      const token = sessionStorage.getItem("token");

      const url = new URL(`${API_BASE_URL}/api/download/submissions-excel`);
      url.searchParams.append("formId", formId);
      if (examDate) url.searchParams.append("examDate", examDate);
      if (paymentStatus)
        url.searchParams.append("paymentStatus", paymentStatus); // ✅ ADD THIS LINE

      const response = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to download Excel");

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `submissions-${formId}${examDate ? `-${examDate}` : ""}${
        paymentStatus ? `-${paymentStatus}` : ""
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
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-sky-300 via-white to-indigo-400 transition-all duration-500">
      <div className="w-full max-w-6xl bg-white/90 rounded-2xl shadow-2xl border border-gray-300 px-8 py-10 flex flex-col gap-10">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-800">
          Competency Certification Verification Panel
        </h1>

        {/* Filters + Actions */}
        <div className="flex flex-col md:flex-row justify-between gap-6 items-center">
          {/* Dropdown Filters */}
          <div className="flex flex-wrap justify-center gap-4">
            <select
              value={selectedFormId}
              onChange={(e) => setSelectedFormId(e.target.value)}
              className="px-4 py-2 rounded-md border border-gray-300 bg-gray-50 text-gray-800 shadow-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Form</option>
              {forms.map((form) => (
                <option key={form._id} value={form._id}>
                  {form.formName}
                </option>
              ))}
            </select>

            {submissions.length > 0 && (
              <>
                <select
                  value={selectedExamDate}
                  onChange={(e) => setSelectedExamDate(e.target.value)}
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none"
                >
                  <option value="">Exam Date</option>
                  {staticExamDates.map((date) => {
                    const isoDate = date.toISOString().split("T")[0];
                    return (
                      <option key={isoDate} value={isoDate}>
                        {date.toDateString()}
                      </option>
                    );
                  })}
                </select>

                <select
                  value={selectedPaymentStatus}
                  onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none"
                >
                  <option value="">Payment</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
                  <option value="Authorized">Authorized</option>
                  <option value="refund">Refunded</option>
                </select>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => setShowListModal(true)}
              disabled={!selectedFormId}
              className={`px-5 py-2 rounded-md text-white font-semibold transition ${
                selectedFormId
                  ? "bg-indigo-600 hover:bg-indigo-700"
                  : "bg-indigo-300 cursor-not-allowed"
              }`}
            >
              Show Submissions
            </button>

            <button
              onClick={() =>
                downloadSubmissionExcel(
                  selectedFormId,
                  selectedExamDate,
                  selectedPaymentStatus
                )
              }
              disabled={!selectedFormId}
              className={`px-5 py-2 rounded-md font-semibold transition ${
                selectedFormId
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-emerald-200 text-emerald-100 cursor-not-allowed"
              }`}
            >
              Download Excel
            </button>

            <button
              onClick={handleLogout}
              className="px-5 py-2 rounded-md text-white font-semibold bg-red-600 hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>

        <Modal show={showListModal} onClose={() => setShowListModal(false)}>
          <h2 className="text-xl font-bold mb-4">
            {forms.find((f) => f._id === selectedFormId)?.formName ||
              "selected form"}
          </h2>
          <table className="min-w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-200 text-left">
                <th className="p-2 border">Sr. no.</th>
                <th className="p-2 border">Submission Date</th>
                <th className="p-2 border">Candidate</th>
                <th className="p-2 border">BNRC Registration</th>
                <th className="p-2 border">Payment Status</th>
                <th className="p-2 border">Amount</th>
                <th className="p-2 border">Files</th>
                <th className="p-2 border">Action</th>
                <th className="p-2 border">Verification</th>
              </tr>
            </thead>
            <tbody>
              {!selectedFormId ? (
                <tr>
                  <td colSpan="8" className="text-center p-4 text-gray-500">
                    Please select a form to view submissions.
                  </td>
                </tr>
              ) : filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center p-4 text-gray-500">
                    No submissions found for this form.
                  </td>
                </tr>
              ) : (
                paginatedSubmissions.map((submission, index) => (
                  <tr key={submission._id} className="hover:bg-gray-50">
                    <td className="p-2 border">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="p-2 border">
                      {submission.createdAt
                        ? new Date(submission.createdAt).toLocaleString()
                        : "N/A"}
                    </td>
                    <td className="p-2 border">
                      {(() => {
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
                    <td className="p-2 border">
                      {submission.paymentStatus || "N/A"}
                    </td>
                    <td className="p-2 border">
                      {submission.form?.paymentDetails?.amount
                        ? `₹${submission.form.paymentDetails.amount.toLocaleString(
                            "en-IN"
                          )}`
                        : "N/A"}
                    </td>
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
                        className="py-1 px-4 bg-green-500 text-white rounded-lg shadow-lg hover:bg-green-600"
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

          {selectedFormId && filteredSubmissions.length > itemsPerPage && (
            <div className="flex justify-between items-center mt-4">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className="px-3 py-1 bg-gray-300 text-sm rounded disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="px-3 py-1 bg-gray-300 text-sm rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
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
  );
}

export default TestUserPanel;
