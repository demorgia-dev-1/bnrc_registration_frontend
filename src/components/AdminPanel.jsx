import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api/api";
import { toast } from "react-toastify";

const Modal = ({ show, onClose, data, children }) => {
  if (!show) return null;

  if (data) {
    const formFields = data.form?.fields || [];
    const responseMap = data.responses || {};
    const uploadedFiles = data?.uploadedFiles || [];

    const fileMap = {};
    uploadedFiles.forEach((file) => {
      if (!fileMap[file.fieldName]) fileMap[file.fieldName] = [];
      fileMap[file.fieldName].push(file);
    });

    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center">
        <div className="bg-white rounded-lg shadow-xl w-11/12 md:w-4/5 lg:w-2/3 max-h-[90vh] overflow-y-auto p-6">
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-bold">Form: {data.form?.formName}</h2>
            <button
              onClick={onClose}
              className="text-red-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          <table className="w-full border border-gray-300 mb-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Field</th>
                <th className="p-2 border">Response</th>
              </tr>
            </thead>
            <tbody>
              {formFields.map((field) => (
                <tr key={field.name}>
                  <td className="border p-2">{field.label}</td>
                  <td className="border p-2">
                    {responseMap[field.name] &&
                    responseMap[field.name].toString().trim()
                      ? responseMap[field.name]
                      : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 className="text-lg font-semibold mb-2">Uploaded Files:</h3>
          {data.uploadedFiles?.length > 0 ? (
            <ul className="space-y-1">
              {data.uploadedFiles.map((file, idx) => (
                <li
                  key={idx}
                  className="flex justify-between bg-gray-100 p-2 rounded"
                >
                  <span>{file.fieldname}</span>
                  <a
                    href={`${API_BASE_URL}/api/download/${file.fileId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1 px-4 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 cursor-pointer"
                  >
                    Download
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p>No files uploaded.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl w-11/12 md:w-4/5 lg:w-2/3 max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Uploaded Files</h2>
          <button
            onClick={onClose}
            className="text-red-600 text-xl font-bold hover:text-red-800"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const AdminPanel = () => {
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
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showFormIdModal, setShowFormIdModal] = useState(false);
  const [formIdInput, setFormIdInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editFormId, setEditFormId] = useState(null);

  const navigate = useNavigate();

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

  const downloadFormExcel = async () => {
    try {
      const token = sessionStorage.getItem("token");

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

  const downloadSubmissionExcel = async () => {
    try {
      const token = sessionStorage.getItem("token");

      const response = await axios.get(
        `${API_BASE_URL}/api/download/submissions-excel`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = "submissions.xlsx";
      link.click();
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download submissions");
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
      setFields(data.fields || []);

      setEditFormId(formIdInput);
      setIsEditing(true);
      setShowFormIdModal(false); // Close the modal
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
      fields,
    };

    try {
      const token = sessionStorage.getItem("token");

      // If editing, send PUT request instead of POST
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
        // Original create logic remains unchanged
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
 
const handleAddField = () => {
  const newField = {
    label: "",
    name: "",
    type: "text",
    required: false,
    options: [],
    optionLabels: [],
    min: "",
    max: "",
  };

  setFields([...fields, newField]);
};

const handleAddFieldBelow = (index) => {
  const newField = {
    label: "",
    name: "",
    type: "text",
    required: false,
    options: [],
    optionLabels: [],
    min: "",
    max: "",
  };

  const updatedFields = [...fields];
  updatedFields.splice(index + 1, 0, newField);
  setFields(updatedFields);
};


  const handleRemoveField = (index) => {
    const updatedFields = fields.filter((_, i) => i !== index);
    setFields(updatedFields);
  };

  const handleFieldChange = (index, field, value) => {
    const newFields = [...fields];
    newFields[index][field] = value;
    setFields(newFields);
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
    <div className="relative min-h-screen">
      <img
        src="/background.jpg"
        alt="Background"
        className="w-full h-full object-cover absolute inset-0"
      />
      <div className="absolute top-0 right-0 h-full w-1/2 flex flex-col items-center justify-center z-10">
        <div className="mt-10 bg-white bg-opacity-95 p-5 rounded-lg shadow-lg w-full max-w-lg max-h-[80vh] flex gap-4">
          {/* Show All Submissions Modal */}
          <button
            onClick={() => setShowListModal(true)}
            className="py-1 px-4 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 cursor-pointer"
          >
            Show Submissions
          </button>

          {/* List Modal */}
          <Modal show={showListModal} onClose={() => setShowListModal(false)}>
            <table className="min-w-full border border-gray-300">
              <thead>
                <tr className="bg-gray-200 text-left">
                  <th className="p-2 border">Candidate</th>
                  <th className="p-2 border">Submission ID</th>
                  <th className="p-2 border">Files</th>
                  <th className="p-2 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {uploadedFiles.map((submission) => (
                  <tr key={submission._id} className="hover:bg-gray-50">
                    <td className="p-2 border">
                      {(() => {
                        const formFields = submission.form?.fields || [];
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

                    <td className="p-2 border">{submission._id}</td>
                    <td className="p-2 border">
                      {submission.uploadedFiles?.length > 0
                        ? submission.uploadedFiles.map((file, i) => (
                            <div key={i}>{file.originalName}</div>
                          ))
                        : "No File"}
                    </td>
                    <td className="p-2 border">
                      <button
                        onClick={() => {
                          setSelectedSubmission(submission);
                          setShowDetailModal(true);
                        }}
                        className="py-1 px-4 bg-green-500 text-white rounded-lg shadow-lg hover:bg-green-600 cursor-pointer"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
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
          />

          <button
            onClick={downloadFormExcel}
            className="py-1 px-4 bg-green-500 text-white rounded-lg shadow-lg hover:bg-green-600 cursor-pointer"
          >
            Download Forms
          </button>

          <button
            onClick={downloadSubmissionExcel}
            className="py-1 px-4 bg-green-500 text-white rounded-lg shadow-lg hover:bg-green-600 cursor-pointer"
          >
            Download Submissions
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-10 bg-white bg-opacity-95 p-10 rounded-l-lg shadow-lg w-full max-w-lg max-h-[80vh] overflow-y-auto"
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
          <div className="mb-4">
            {fields.map((field, index) => (
              <div key={index} className="border p-4 rounded-lg mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block font-medium">Field Name:</label>
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) =>
                        handleFieldChange(index, "label", e.target.value)
                      }
                      required
                      className="border p-2 w-full"
                    />
                  </div>

                  <div>
                    <label className="block font-medium">Field Type:</label>
                    <select
                      value={field.type}
                      onChange={(e) =>
                        handleFieldChange(index, "type", e.target.value)
                      }
                      className="border p-2 w-full"
                    >
                      {fieldTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) =>
                        handleFieldChange(index, "required", e.target.checked)
                      }
                      className="mr-2"
                    />
                    <label>Required</label>
                  </div>
                </div>

                {/* Field-specific options */}
                {(field.type === "select" ||
                  field.type === "select-multiple" ||
                  field.type === "radio") && (
                  <div className="mb-4">
                    <label className="block font-medium">
                      Options (comma separated):
                    </label>
                    <input
                      type="text"
                      value={field.options.join(",")}
                      onChange={(e) =>
                        handleFieldChange(
                          index,
                          "options",
                          e.target.value.split(",")
                        )
                      }
                      className="border p-2 w-full"
                      placeholder="Option1,Option2,Option3"
                    />
                  </div>
                )}

                {field.type === "number" && (
                  <div className="grid grid-cols-2 gap-4 mb-4"></div>
                )}

                {field.type === "range" && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block font-medium">Min Value:</label>
                      <input
                        type="number"
                        onWheel={(e) => e.target.blur()}
                        value={field.min || ""}
                        onChange={(e) =>
                          handleFieldChange(index, "min", e.target.value)
                        }
                        className="border p-2 w-full"
                      />
                    </div>
                    <div>
                      <label className="block font-medium">Max Value:</label>
                      <input
                        onWheel={(e) => e.target.blur()}
                        type="number"
                        value={field.max || ""}
                        onChange={(e) =>
                          handleFieldChange(index, "max", e.target.value)
                        }
                        className="border p-2 w-full"
                      />
                    </div>
                  </div>
                )}

                {field.type === "range" && (
                  <div className="mb-4">
                    <label className="block font-medium">Step:</label>
                    <input
                      type="number"
                      onWheel={(e) => e.target.blur()}
                      value={field.step || ""}
                      onChange={(e) =>
                        handleFieldChange(index, "step", e.target.value)
                      }
                      className="border p-2 w-full"
                    />
                  </div>
                )}

                {field.type === "date" && (
                  <div className="grid grid-cols-2 gap-4 mb-4"></div>
                )}

                {(field.type === "text" || field.type === "textarea") && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block font-medium">Min Length:</label>
                      <input
                        type="number"
                        onWheel={(e) => e.target.blur()}
                        value={field.minLength || ""}
                        onChange={(e) =>
                          handleFieldChange(index, "minLength", e.target.value)
                        }
                        className="border p-2 w-full"
                      />
                    </div>
                    <div>
                      <label className="block font-medium">Max Length:</label>
                      <input
                        type="number"
                        onWheel={(e) => e.target.blur()}
                        value={field.maxLength || ""}
                        onChange={(e) =>
                          handleFieldChange(index, "maxLength", e.target.value)
                        }
                        className="border p-2 w-full"
                      />
                    </div>
                  </div>
                )}
                <div className="flex gap-4 mt-4 ">
                  <button
                    type="button"
                    onClick={() => handleAddFieldBelow(index)}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg "
                  >
                    Add Field Below
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveField(index)}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg"
                  >
                    Remove Field
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddField}
              className="bg-green-500 text-white px-4 py-2 mt-2 rounded-lg cursor-pointer hover:bg-green-600"
            >
              Add New Field
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

        <div
          className="mt-10 mb-10 bg-white bg-opacity-95 p-10 rounded-l-lg shadow-lg w-full max-w-lg max-h-[80vh] overflow-y-auto"
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
  );
};

export default AdminPanel;
