import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import  { API_BASE_URL } from "../api/api"

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
  const [error, setError] = useState(null);

  const navigate = useNavigate();

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
    console.log("api", API_BASE_URL)
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/create-form`,
        formData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      console.log("Form created successfully:", res.data);

      const formId = res.data.form?._id;

      if (formId) {
        console.log("Form ID:", formId);
        openFormInNewTab(formId);
        generatePlaceholder();
      } else {
        console.error("Form ID missing from the response.");
      }

      // Reset form fields
      setFormName("");
      setStartDate("");
      setEndDate("");
      setStatus("Active");
      setPaymentRequired(false);
      setPaymentDetails({ amount: "", method: "" });
      setFields([]);
    } catch (error) {
      console.error("Error creating form:", error);
      // alert("Failed to create form.");
    }
  };
  const openFormInNewTab = (formId) => {
    const newTabUrl = `/user-form/${formId}`;
    const newTab = window.open(newTabUrl, "_blank");

    if (!newTab) {
      alert("Popup blocked! Please allow popups for this site.");
    }
  };

  const generatePlaceholder = (field) => {
    const label = field.label.toLowerCase();

    switch (field.type) {
      case "email":
        return `Enter your ${label} (e.g., example@domain.com)`;
      case "date":
        return `Select ${label} date`;
      case "time":
        return `Select ${label} time`;
      case "number":
        return `Enter ${label} in numbers`;
      case "select":
      case "select-multiple":
        return `Choose ${label} option(s)`;
      case "checkbox":
      case "radio":
        return ""; // No placeholder for these types
      case "file":
        return `Upload ${label} file`;
      case "range":
        return `Slide to select ${label}`;
      case "color":
        return `Pick ${label} color`;
      default:
        return `Enter ${label}`;
    }
  };

  const handleAddField = () => {
    setFields([
      ...fields,
      {
        label: "",
        name: "",
        type: "text",
        required: false,
        options: [],
        optionLabels: [],
        min: "",
        max: "",
      },
    ]);
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
      console.log("Fetched form:", res.data);
      setCreatedForm(res.data);
      // setShowModal(true);
    } catch (error) {
      console.error("Error fetching form:", error);
    }
  };

  const extendEndDate = async (formId, newEndDate) => {
    try {
      const res = await axios.put(
        `${API_BASE_URL}/api/forms/${formId}/extend`,
        { newEndDate }
      );
      alert("Form expiry date extended successfully.");
      fetchForm(formId);
    } catch (error) {
      console.error("Failed to extend end date:", error);
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

         <div className="flex gap-10 p-5">
         <a href="http://localhost:5000/api/download/forms-excel" target="_blank" rel="noopener noreferrer" className="py-1 px-4 bg-white bg-opacity-95  rounded-l-lg shadow-lg overflow-y-auto">
  Download All Forms (Excel)
</a>

<a href="http://localhost:5000/api/download/submissions-excel" target="_blank" rel="noopener noreferrer" className="py-1 px-4 bg-white bg-opacity-95  rounded-l-lg shadow-lg overflow-y-auto">
  Download All Submissions (Excel)
</a>
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
              onChange={(e) => setPaymentDetails({ ...paymentDetails, amount: e.target.value })}
              className="border p-2 w-full"
            />
          </div>
          <div className="mb-4">
            <label className="block font-medium">Payment Method:</label>
            <input
              type="text"
              value={paymentDetails.method}
              onChange={(e) => setPaymentDetails({ ...paymentDetails, method: e.target.value })}
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
                      value={field.step || ""}
                      onChange={(e) =>
                        handleFieldChange(index, "step", e.target.value)
                      }
                      className="border p-2 w-full"
                    />
                  </div>
                )}

                {field.type === "date" && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* <input
                      type="date"
                      value={field.dateMax || ""}
                      onChange={(e) => handleFieldChange(index, "dateMax", e.target.value)}
                      className="border p-2 w-full"
                    /> */}
                  </div>
                )}

                {(field.type === "text" || field.type === "textarea") && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block font-medium">Min Length:</label>
                      <input
                        type="number"
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
                        value={field.maxLength || ""}
                        onChange={(e) =>
                          handleFieldChange(index, "maxLength", e.target.value)
                        }
                        className="border p-2 w-full"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleRemoveField(index)}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg"
                >
                  Remove Field
                </button>
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

          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 mt-4 rounded-lg cursor-pointer hover:bg-blue-600"
          >
            Create Form
          </button>
        </form>
        <div className="mt-10 bg-white bg-opacity-95 p-10 rounded-l-lg shadow-lg w-full max-w-lg max-h-[80vh] overflow-y-auto">
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
