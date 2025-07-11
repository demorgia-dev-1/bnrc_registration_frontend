import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api/api";
import { toast } from "react-toastify";
import CreateResult from "./CreateExamResults";

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
            <h2 className="text-xl font-bold">{data?.form?.formName}</h2>
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

export const AdminPanel = () => {
  const [formName, setFormName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [extendDate, setExtendDate] = useState("");
  const [status, setStatus] = useState("Active");
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    amount: "",
    method: "",
  });
  const [fields, setFields] = useState([]);
  const [createdForm, setCreatedForm] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [showListModal, setShowListModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showFormIdModal, setShowFormIdModal] = useState(false);
  const [formIdInput, setFormIdInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editFormId, setEditFormId] = useState(null);
  const [forms, setForms] = useState([]);
  const [selectedFormId, setSelectedFormId] = useState("");
  const [sections, setSections] = useState([{ name: "", fields: [] }]);
  const [instructionsTitle, setInstructionsTitle] = useState("");
  const [generalInstructions, setGeneralInstructions] = useState("");
  const [iscreateResult, setIsCreateResult] = useState(false);
  const [examDates, setExamDates] = useState([]);
  const [selectedExamDate, setSelectedExamDate] = useState("");
  const [examFilteredSubmissions, setExamFilteredSubmissions] = useState([]);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const navigate = useNavigate();

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

    return result;
  })();

  const filteredSubmissions = submissions.filter((submission) => {
    const matchesForm = submission.form?._id === selectedFormId;
    const matchesDate =
      !selectedExamDate ||
      submission.responses?.exam_date_selection === selectedExamDate;
    const matchesPayment =
      !selectedPaymentStatus ||
      submission.paymentStatus === selectedPaymentStatus;

    return matchesForm && matchesDate && matchesPayment;
  });

  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
  const paginatedSubmissions = filteredSubmissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
        console.log("token", token);
        const res = await fetch(`${API_BASE_URL}/api/forms`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setForms(data);
      } catch (err) {
        console.error("Failed to fetch forms", err);
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
        setSubmissions(res.data.submissions); // ✅ Correct source
      } catch (err) {
        console.error("Error fetching submissions:", err);
      }
    };

    fetchSubmissions();
  }, []);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/files`);
        setUploadedFiles(res.data.files || []);
      } catch (err) {
        console.error("Error fetching files:", err);
      }
    };

    fetchFiles();
  }, []);

  useEffect(() => {
    if (generalInstructions) {
    }
  }, [generalInstructions]);

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

    setExamFilteredSubmissions(filtered);
  }, [submissions, selectedFormId, selectedExamDate]);

  const handleLogout = () => {
    sessionStorage.clear(); // or sessionStorage.removeItem('token') and others if you prefer
    window.location.href = "/login"; // Redirect to login page
  };

  const downloadFormExcel = async () => {
    try {
      const token = sessionStorage.getItem("token");
      console.log("token", token);
      const response = await axios.get(
        `${API_BASE_URL}/api/download/forms-excel`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = "forms.xlsx";
      link.click();
    } catch (error) {
      if (
        error.response &&
        error.response.data instanceof Blob &&
        error.response.data.type === "application/json"
      ) {
        const reader = new FileReader();
        reader.onload = () => {
          const errorMessage = JSON.parse(reader.result);
          console.error("Error downloading Excel:", errorMessage);
          alert("Download failed: " + (errorMessage?.error || "Unknown error"));
        };
        reader.readAsText(error.response.data);
      } else {
        console.error(" Download error:", error);
        alert(
          "Download failed: " + (error.response?.data?.error || error.message)
        );
      }
    }
  };

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

  const handleEditForm = async () => {
    if (!formIdInput) {
      toast.error("Please enter a Form ID.");
      return;
    }

    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/api/forms/${formIdInput}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = res.data;
      if (!data) return toast.error("Form not found.");

      setFormName(data.formName || "");
      setStartDate(data.startDate?.slice(0, 10) || "");
      setEndDate(data.endDate?.slice(0, 10) || "");
      setStatus(data.status || "Active");
      setPaymentRequired(data.paymentRequired || false);
      setPaymentDetails(data.paymentDetails || { amount: "", method: "" });
      setInstructionsTitle(data.instructionsTitle || "");
      setGeneralInstructions(data.generalInstructions || "");

      setFields(data.fields || []); // if you still need it
      setSections(data.sections || []); // <--- ADD THIS LINE to load sections for editing

      setEditFormId(formIdInput);
      setIsEditing(true);
      setShowFormIdModal(false);
    } catch (error) {
      console.error("Error fetching form for edit:", error);
      toast.error("Failed to load form for editing.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = {
      formName,
      startDate,
      endDate,
      status,
      paymentRequired,
      paymentDetails: paymentRequired ? paymentDetails : null,
      sections,
      instructionsTitle,
      generalInstructions,
    };

    try {
      const token = sessionStorage.getItem("token");

      if (isEditing && editFormId) {
        const res = await axios.put(
          `${API_BASE_URL}/api/forms/${editFormId}/edit`,
          formData,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("Form updated successfully:", res.data);
        toast.success("Form updated successfully");
        setFormName("");
        setStartDate("");
        setEndDate("");
        setStatus("Active");
        setPaymentRequired(false);
        setPaymentDetails({ amount: "", method: "" });
        setFields([]);
        openFormInNewTab(editFormId);
        setIsEditing(false);
        setEditFormId(null);
      } else {
        const res = await axios.post(
          `${API_BASE_URL}/api/create-form`,
          formData,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("Form created successfully:", res.data);
        toast.success("Form created successfully");

        const formId = res.data.form?._id;

        if (formId) {
          console.log("Form ID:", formId);

          setFormName("");
          setStartDate("");
          setEndDate("");
          setStatus("Active");
          setPaymentRequired(false);
          setPaymentDetails({ amount: "", method: "" });
          setFields([]);

          openFormInNewTab(formId);
        } else {
          console.error("Form ID missing from the response.");
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to submit form.");
    }
  };

  const openFormInNewTab = (formId) => {
    const newTabUrl = `/user-form/${formId}`;
    const newTab = window.open(newTabUrl, "_blank");

    if (!newTab) {
      alert("Popup blocked! Please allow popups for this site.");
    }
  };

  const handleAddSection = () => {
    setSections([
      ...sections,
      {
        sectionTitle: "",
        fields: [],
      },
    ]);
  };

  const handleRemoveSection = (index) => {
    const updated = [...sections];
    updated.splice(index, 1);
    setSections(updated);
  };

  const handleSectionChange = (sectionIndex, field, value) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex][field] = value;
    setSections(updatedSections);
  };

  const handleAddFieldBelow = (sectionIndex, fieldIndex) => {
    const newField = {
      label: "",
      type: "text",
      required: false,
      options: [],
      optionLabels: [],
      min: "",
      max: "",
    };

    const updated = [...sections];
    updated[sectionIndex].fields.splice(fieldIndex + 1, 0, newField);
    setSections(updated);
  };

  const handleAddField = (sectionIndex) => {
    const updated = [...sections];
    updated[sectionIndex].fields.push({
      label: "",
      name: "",
      type: "text",
      required: false,
      options: [],
      optionLabels: [],
      min: "",
      max: "",
    });
    setSections(updated);
  };

  const handleFieldChange = (sectionIndex, fieldIndex, key, value) => {
    const updated = [...sections];
    updated[sectionIndex].fields[fieldIndex][key] = value;
    setSections(updated);
  };

  const handleRemoveField = (sectionIndex, fieldIndex) => {
    setSections((prevSections) => {
      const updated = [...prevSections];
      const sectionFields = [...updated[sectionIndex].fields];

      sectionFields.splice(fieldIndex, 1); // remove the correct field
      updated[sectionIndex] = {
        ...updated[sectionIndex],
        fields: sectionFields,
      };

      return updated;
    });
  };

  const fetchForm = async (formId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/forms/${formId}`);
      setCreatedForm(res.data);
    } catch (error) {
      console.error("Error fetching form:", error);
    }
  };

  const extendEndDate = async (formId, newEndDate) => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.put(
        `${API_BASE_URL}/api/forms/${formId}/extend`,
        { newEndDate },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Form expiry date extended successfully.");
      fetchForm(formId);
      setFormIdInput("");
      setExtendDate("");
    } catch (error) {
      console.error("Failed to extend end date:", error);
      toast.error(error);
    }
  };

  const fieldTypes = [
    "text",
    "email",
    "password",
    "number",
    "date",
    "time",
    "file",
    "checkbox",
    "radio",
    "select",
    "select-multiple",
    "textarea",
    "range",
    "color",
  ];

  return (
    <div className="relative min-h-screen w-full items-center bg-gradient-to-br from-sky-300 via-white to-indigo-400 transition-all duration-500">
      <div className="absolute h-full w-full px-10 flex  m-4 items-center gap-5 flex justify-between  z-10">
        {/*  create form */}

        <form
          onSubmit={handleSubmit}
          className="mt-10 bg-white bg-opacity-95 p-10 rounded-lg shadow-xl w-1/2  max-h-[80vh] overflow-y-auto"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#ccc #f0f0f0" }}
        >
          <h2 className="text-2xl font-bold mb-6 text-center">Create Form</h2>
          <div className="mb-4">
            <label className="block font-bold">Form Name:</label>
            <input
              type="text"
              value={formName}
              placeholder="Enter form name"
              onChange={(e) => setFormName(e.target.value)}
              required
              className="border p-2 w-full"
            />
          </div>

          <div className="mb-4">
            <label className="block font-bold">Start Date:</label>
            <input
              type="date"
              value={startDate}
              placeholder="Select start date"
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="border p-2 w-full"
            />
          </div>

          <div className="mb-4">
            <label className="block font-bold">End Date:</label>
            <input
              type="date"
              value={endDate}
              placeholder="Select end date"
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="border p-2 w-full"
            />
          </div>
          <div className="mb-4">
            <label className="block font-bold">Status:</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border p-2 w-full"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="mb-4 flex items-center gap-4 rounded-lg ">
            <label className="block font-bold">Payment Required:</label>
            <input
              type="checkbox"
              checked={paymentRequired}
              onChange={() => setPaymentRequired(!paymentRequired)}
            />
          </div>

          {paymentRequired && (
            <div className="mt-10">
              <h3 className="text-lg font-semibold mb-2">Payment Details</h3>
              <div className="mb-4">
                <label className="block font-medium">Amount:</label>
                <input
                  type="number"
                  value={paymentDetails.amount}
                  onWheel={(e) => e.target.blur()}
                  onChange={(e) =>
                    setPaymentDetails({
                      ...paymentDetails,
                      amount: e.target.value,
                    })
                  }
                  className="border p-2 w-full"
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium">Payment Method:</label>
                <input
                  type="text"
                  value={paymentDetails.method}
                  onChange={(e) =>
                    setPaymentDetails({
                      ...paymentDetails,
                      method: e.target.value,
                    })
                  }
                  className="border p-2 w-full"
                />
              </div>
            </div>
          )}

          {/* Sections */}
          <div className="mt-6 space-y-6">
            <div className="mb-6">
              <input
                className="w-full border p-2 mb-2 capitalize"
                placeholder="General Instructions Title"
                value={instructionsTitle}
                onChange={(e) => setInstructionsTitle(e.target.value)}
                required
              />
              <label className="block font-semibold text-gray-700 mb-1">
                General Instructions (shown before the form starts)
              </label>
              <textarea
                rows={5}
                className="w-full border p-2 rounded"
                placeholder="Enter general instructions here..."
                value={generalInstructions}
                onChange={(e) => setGeneralInstructions(e.target.value)}
              />
            </div>
            {sections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="border p-4 rounded">
                <div className="flex justify-between items-center">
                  <input
                    className="w-full border p-2 mb-2 capitalize"
                    placeholder="Section Title"
                    value={section.sectionTitle}
                    onChange={(e) =>
                      handleSectionChange(
                        sectionIndex,
                        "sectionTitle",
                        e.target.value
                      )
                    }
                    required
                  />

                  <button
                    type="button"
                    className="bg-red-500 text-white px-4 rounded-lg cursor-pointer ml-2 hover:bg-red-600"
                    onClick={() => handleRemoveSection(sectionIndex)}
                  >
                    Remove Section
                  </button>
                </div>
                {section.fields.map((field, fieldIndex) => (
                  <div
                    key={fieldIndex}
                    className="border p-3 mb-2 rounded bg-gray-50"
                  >
                    <input
                      className="w-full border p-2 mb-2"
                      placeholder="Field Label"
                      value={field.label}
                      onChange={(e) =>
                        handleFieldChange(
                          sectionIndex,
                          fieldIndex,
                          "label",
                          e.target.value
                        )
                      }
                    />
                    <select
                      className="w-full border p-2 mb-2"
                      value={field.type}
                      onChange={(e) =>
                        handleFieldChange(
                          sectionIndex,
                          fieldIndex,
                          "type",
                          e.target.value
                        )
                      }
                    >
                      {fieldTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    {(field.type === "select" ||
                      field.type === "select-multiple" ||
                      field.type === "radio") && (
                      <input
                        className="w-full border p-2 mb-2"
                        placeholder="Options (comma separated)"
                        value={field.options.join(",")}
                        onChange={(e) =>
                          handleFieldChange(
                            sectionIndex,
                            fieldIndex,
                            "options",
                            e.target.value.split(",")
                          )
                        }
                      />
                    )}
                    {field.type === "range" && (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Min"
                          className="w-full border p-2"
                          value={field.min || ""}
                          onChange={(e) =>
                            handleFieldChange(
                              sectionIndex,
                              fieldIndex,
                              "min",
                              e.target.value
                            )
                          }
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          className="w-full border p-2"
                          value={field.max || ""}
                          onChange={(e) =>
                            handleFieldChange(
                              sectionIndex,
                              fieldIndex,
                              "max",
                              e.target.value
                            )
                          }
                        />
                        <input
                          type="number"
                          placeholder="Step"
                          className="w-full border p-2"
                          value={field.step || ""}
                          onChange={(e) =>
                            handleFieldChange(
                              sectionIndex,
                              fieldIndex,
                              "step",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    )}
                    {(field.type === "text" || field.type === "textarea") && (
                      <div className="flex gap-2 mt-2">
                        <input
                          type="number"
                          placeholder="Min Length"
                          className="w-full border p-2"
                          value={field.minLength || ""}
                          onChange={(e) =>
                            handleFieldChange(
                              sectionIndex,
                              fieldIndex,
                              "minLength",
                              e.target.value
                            )
                          }
                        />
                        <input
                          type="number"
                          placeholder="Max Length"
                          className="w-full border p-2"
                          value={field.maxLength || ""}
                          onChange={(e) =>
                            handleFieldChange(
                              sectionIndex,
                              fieldIndex,
                              "maxLength",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    )}
                    <label className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) =>
                          handleFieldChange(
                            sectionIndex,
                            fieldIndex,
                            "required",
                            e.target.checked
                          )
                        }
                      />
                      Required
                    </label>
                    <div className="flex gap-4 mt-4 ">
                      <button
                        type="button"
                        onClick={() =>
                          handleAddFieldBelow(sectionIndex, fieldIndex)
                        }
                        className="bg-green-500 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-green-600"
                      >
                        Add Field Below
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveField(sectionIndex, fieldIndex)
                        }
                        className="bg-red-500 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-red-600"
                      >
                        Remove Field
                      </button>
                    </div>{" "}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddField(sectionIndex)}
                  className="bg-green-500 text-white px-4 py-2 mt-2 rounded-lg cursor-pointer hover:bg-green-600"
                >
                  Add New Field
                </button>{" "}
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddSection}
              className="bg-green-500 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-green-600"
            >
              Add Section
            </button>
          </div>

          <div className="flex gap-4 mt-4">
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              {isEditing ? "Update Form" : "Create Form"}
            </button>

            <button
              type="button"
              onClick={() => setShowFormIdModal(true)}
              className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600"
            >
              Edit Form
            </button>
          </div>
        </form>

        {showFormIdModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
              <h2 className="text-xl font-bold mb-4 text-center">
                Enter Form ID
              </h2>
              <input
                type="text"
                value={formIdInput}
                onChange={(e) => setFormIdInput(e.target.value)}
                placeholder="Enter Form ID"
                className="border p-2 w-full mb-4"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowFormIdModal(false)}
                  className="bg-gray-400 text-white px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditForm}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  Load Form
                </button>
              </div>
            </div>
          </div>
        )}

        {/* all submissions list modal */}
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
                <th className="p-2 border">Submission ID</th>
                <th className="p-2 border">Candidate</th>
                <th className="p-2 border">BNRC Registration</th>
                <th className="p-2 border">Payment Status</th>
                <th className="p-2 border">Amount</th>
                <th className="p-2 border">Files</th>
                <th className="p-2 border">Action</th>
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
                    <td className="p-2 border">{submission._id}</td>
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
        />

        {/* extend form expiry date and show submissions*/}
        <div className="p-5 rounded-lg shadow-xl bg-white w-1/2 mt-10 h-[80vh] items-center justify-center flex flex-col">
          <div className="mt-5 p-5 rounded-lg w-full max-w-lg flex flex-wrap justify-between gap-2 bg-blue-200 shadow-xl">
            <div className="flex flex-wrap items-center gap-4 ">
              <select
                id="formSelect"
                value={selectedFormId}
                onChange={(e) => setSelectedFormId(e.target.value)}
                className="py-2 px-3 rounded-md bg-blue-700 text-white cursor-pointer focus:outline-none hover:bg-blue-800"
              >
                <option value="" className="text-white">
                  Select a form
                </option>
                {forms.map((form) => (
                  <option
                    key={form._id}
                    value={form._id}
                    className="text-white"
                  >
                    {form.formName}
                  </option>
                ))}
              </select>

              {selectedFormId && submissions.length > 0 && (
                <>
                  <select
                    id="dateFilter"
                    value={selectedExamDate}
                    onChange={(e) => setSelectedExamDate(e.target.value)}
                    className="py-2 px-3 rounded-md bg-blue-700 text-white cursor-pointer focus:outline-none hover:bg-blue-800"
                  >
                    <option value="">Select Exam Date</option>
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
                    id="paymentFilter"
                    value={selectedPaymentStatus}
                    onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                    className="py-2 px-3 rounded-md bg-blue-700 text-white cursor-pointer focus:outline-none hover:bg-blue-800"
                  >
                    <option value="">All Payments</option>
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                  </select>
                </>
              )}
            </div>

            {/* Show All Submissions Modal */}
            <button
              onClick={() => setShowListModal(true)}
              className="py-1 px-4 bg-blue-700 text-white rounded-lg shadow-xl hover:bg-blue-800 cursor-pointer"
            >
              Show Submissions
            </button>

            <button
              onClick={downloadFormExcel}
              className="py-2 px-4 bg-blue-700 text-white rounded-lg shadow-xl hover:bg-blue-800 cursor-pointer"
            >
              Download Forms
            </button>

            <button
              onClick={() =>
                downloadSubmissionExcel(
                  selectedFormId,
                  selectedExamDate,
                  selectedPaymentStatus
                )
              }
              className="py-2 px-4 bg-blue-700 text-white rounded-lg shadow-xl hover:bg-blue-800 cursor-pointer"
            >
              Download Submissions Excel
            </button>
            <button
              onClick={() => setIsCreateResult(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create Result
            </button>
            {iscreateResult && (
              <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center">
                <div className="bg-white rounded-lg shadow-xl w-auto max-h-[90vh] overflow-y-auto p-6">
                  <button
                    onClick={() => setIsCreateResult(false)}
                    className="text-red-600 text-2xl font-bold cursor-pointer right-4"
                  >
                    ×
                  </button>
                  <h2 className="text-2xl font-semibold mb-4 text-center">
                    Create Result
                  </h2>
                  <CreateResult />
                </div>
              </div>
            )}
            <button
              onClick={() => window.open("/results", "_blank")}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Show Results
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
          <div
            className="mt-10 mb-10  bg-blue-200 bg-opacity-95 p-10 rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
            style={{ scrollbarWidth: "thin", scrollbarColor: "#ccc #f0f0f0" }}
          >
            <h2 className="text-xl font-bold mb-2 text-center">
              Extend Form Expiry
            </h2>
            <div className="flex items-center mb-4 ">
              <input
                type="text"
                placeholder="Enter Form ID"
                className="border p-2 mr-2 w-1/2"
                onChange={(e) =>
                  setCreatedForm({ ...createdForm, _id: e.target.value })
                }
              />
              <input
                type="date"
                value={extendDate}
                onChange={(e) => setExtendDate(e.target.value)}
                className="border p-2 mr-2 w-1/2"
              />
            </div>
            <button
              onClick={() => extendEndDate(createdForm?._id, extendDate)}
              className="bg-green-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-green-700"
            >
              Extend
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
