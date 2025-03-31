import axios from "axios";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE_URL } from "../api/api";
import { useRef } from "react";

const UserForm = ({ fields: initialFields }) => {
  const { formId } = useParams();
  const [formData, setFormData] = useState({});
  const [form, setForm] = useState(null);
  const [formResponses, setFormResponses] = useState({});
  const [errors, setErrors] = useState({});
  const [selectOthers, setSelectOthers] = useState({});
  const [customOptions, setCustomOptions] = useState({});
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRefs = useRef({});

  useEffect(() => {
    if (!formId && !initialFields) return;

    const loadForm = async () => {
      try {
        let formData;

        if (formId) {
          const res = await axios.get(`${API_BASE_URL}/api/forms/${formId}`);
          formData = res.data;
        } else {
          formData = { fields: initialFields };
        }

        const initialResponses = {};
        formData.fields.forEach((field) => {
          if (field.type === "checkbox" || field.type === "radio") {
            initialResponses[field.name] = false;
          } else if (field.type === "select-multiple") {
            initialResponses[field.name] = [];
          } else {
            initialResponses[field.name] = "";
          }
        });

        setForm(formData);
        setFormResponses(initialResponses);
        setFormData(formData);

        if (formData.paymentRequired && formData.paymentDetails) {
          setPaymentInfo(formData.paymentDetails);
        }
      } catch (error) {
        console.error("Error fetching form:", error);
      }
    };

    loadForm();
  }, [formId, initialFields]);

  useEffect(() => {
    if (!formResponses.sameAsPermanent) return;

    setFormResponses((prev) => {
      const updated = { ...prev };
      form.fields.forEach((field) => {
        const name = field.name.toLowerCase();
        if (name.includes("correspondence")) {
          const relatedPermanentField = name.replace(
            "correspondence",
            "permanent"
          );
          updated[field.name] = prev[relatedPermanentField] || "";
        }
      });
      return updated;
    });
  }, [
    formResponses.sameAsPermanent,
    formResponses.permanent_address_line1,
    formResponses.permanent_city,
    formResponses.permanent_state,
  ]);

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[6-9]\d{9}$/;
    const aadhaarRegex = /^\d{12}$/;

    form?.fields?.forEach((field) => {
      const value = formResponses[field.name];

      if (
        field.required &&
        (!value || value === "" || (Array.isArray(value) && value.length === 0))
      ) {
        errors[field.name] = `${field.label} is required.`;
      }

      // Email
      if (field.type === "email" && value && !emailRegex.test(value)) {
        errors[field.name] = "Invalid email format.";
      }

      // Phone
      if (
        field.name.toLowerCase().includes("contact") &&
        value &&
        !phoneRegex.test(value)
      ) {
        errors[field.name] = "Invalid contact number.";
      }
      const lowerName = field.name.toLowerCase();
      const isAadhaarField = /(aadhaar|aadhar|adhar)/i.test(lowerName);
      const isFileUpload = value instanceof File;

      if (
        isAadhaarField &&
        !isFileUpload &&
        value &&
        !aadhaarRegex.test(value)
      ) {
        errors[field.name] = "Invalid Aadhaar number. Must be 12 digits.";
      }
    });

    return errors;
  };

  const hasAddressFields = () => {
    const fieldNames = form?.fields?.map((f) => f.name.toLowerCase()) || [];
    return (
      fieldNames.some((name) => name.includes("permanent")) &&
      fieldNames.some((name) => name.includes("correspondence"))
    );
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files, options } = e.target;
    let newValue;
    if (type === "checkbox") {
      newValue = checked;
    } else if (type === "file") {
      newValue = files[0];
    } else if (type === "select-multiple") {
      newValue = Array.from(options)
        .filter((option) => option.selected)
        .map((option) => option.value);
    } else {
      newValue = value;
    }

    setFormResponses((prev) => ({ ...prev, [name]: newValue }));

    if (e.target.tagName === "SELECT" && value === "Other") {
      setSelectOthers((prev) => ({ ...prev, [name]: true }));
    } else if (e.target.tagName === "SELECT") {
      setSelectOthers((prev) => ({ ...prev, [name]: false }));
    }
  };
  const handleOtherInput = (name, value) => {
    const updatedForm = { ...form };
    const fieldIndex = updatedForm.fields.findIndex((f) => f.name === name);

    if (fieldIndex !== -1) {
      const options = updatedForm.fields[fieldIndex].options || [];
      const alreadyExists = options.some(
        (opt) => (typeof opt === "string" ? opt : opt.value) === value
      );

      if (!alreadyExists) {
        updatedForm.fields[fieldIndex].options = [
          ...options,
          { label: value, value },
        ];
      }

      setForm(updatedForm);

      setFormResponses((prev) => ({ ...prev, [name]: value }));

      setSelectOthers((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);

      setIsSubmitting(false);

      return;
    }

    try {
      const token = sessionStorage.getItem("token");
      const formData = new FormData();
      formData.append("form", form._id);
      const responses = {};
      Object.entries(formResponses).forEach(([fieldName, value]) => {
        if (value instanceof File) {
          formData.append("files", value);
        } else {
          responses[fieldName] = value;
        }
      });
      formData.append("responses", JSON.stringify(responses));
      const response = await axios.post(
        `${API_BASE_URL}/api/submit-form/${form._id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 201) {
        alert("Form submitted successfully!");

        setFormResponses({}); 
      setErrors({});
      
      Object.values(fileInputRefs.current).forEach((input) => {
        if (input) input.value = "";
      });

        setIsSubmitting(false);

        const submissionId = response.data.submission._id;
        if (response.data.paymentRequired) {
          const data = await axios.post(
            `${API_BASE_URL}/api/payment/create-order/${submissionId}`
          );
          console.log("data", data);
          const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: data.data.order.amount,
            currency: "INR",
            name: "form submission",
            description: "Form Submission Payment",
            order_id: data.data.order.id,

            theme: { color: "#3399cc" },
          };

          const razorpay = new window.Razorpay(options);
          razorpay.open();
        }
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error("Submission failed:", error);
      alert(
        `Submission failed: ${error.response?.data?.message || error.message}`
      );
      setIsSubmitting(false);
    }
  };

  const isExperienceZero = () => {
    const experienceField = form?.fields?.find(
      (f) => f.name.toLowerCase().includes("experience") && f.type === "number"
    );
    const value = formResponses[experienceField?.name];
    return (
      experienceField &&
      (value === "0" || value === 0 || value === "0.0" || value === 0.0)
    );
  };

  const shouldDisableField = (fieldName) => {
    const keywords = [
      "employer",
      "company",
      "designation",
      "job",
      "work",
      "employment",
      "experience_details",
    ];
    return (
      isExperienceZero() &&
      keywords.some((keyword) => fieldName.toLowerCase().includes(keyword))
    );
  };

  if (!formData) return <div>Loading...</div>;

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-cover bg-center relative">
      <img
        src="/formpm.jpg"
        alt="form"
        className="w-full h-full object-cover absolute inset-0"
      />
      <div className="absolute inset-0 flex items-center justify-center z-10 w-full">
        <form
          onSubmit={handleSubmit}
          encType="multipart/form-data"
          className="bg-opacity-95 p-4 md:p-10 w-[90%]  sm:max-w-[90%] md:max-w-[80%] lg:max-w-[70%]  rounded-lg shadow-lg max-h-[80vh] overflow-y-auto bg-sky-50"          
          id="user-form"
        >
          <h2 className="text-3xl text-center font-bold mb-10">
            {formData.formName}
          </h2>

          <div className="flex flex-wrap justify-between gap-4 w-full">
            {formData?.fields?.map((field, index) => (
              <React.Fragment key={index}>
                {/* <div
                  className={`mb-4 ${
                    ["textarea"].includes(field.type) ? "col-span-2" : "md:w-[48%]"
                  }`}
                > */}
                <div
                  className={`mb-4 ${
                    field.type === "textarea"
                      ? "w-full"
                      : "w-full sm:basis-[48%] sm:max-w-[48%]"
                  }`}
                >
                  <label className="block font-bold capitalize mb-2">
                    {field.label}:
                  </label>
                  {field.type === "text" && (
                    <input
                      type="text"
                      name={field.name}
                      value={formResponses[field.name] || ""}
                      onChange={handleInputChange}
                      placeholder={
                        field.placeholder ||
                        `Enter your ${field.label.toLowerCase()}`
                      }
                      required={field.required}
                      disabled={shouldDisableField(field.name)}
                      className={`border border-2 p-2 w-full rounded focus:outline-none focus:ring-2 shadow-md ${
                        shouldDisableField(field.name)
                          ? "bg-gray-200 cursor-not-allowed text-gray-500"
                          : "focus:border-none focus:ring-blue-400"
                      }`}
                    />
                  )}
                  {/* Email Input */}
                  {field.type === "email" && (
                    <input
                      type="email"
                      name={field.name}
                      value={formResponses[field.name] || ""}
                      onChange={handleInputChange}
                      placeholder={
                        field.placeholder ||
                        `Enter your ${field.label.toLowerCase()}`
                      }
                      required={field.required}
                      className="border border-2 p-2 w-full rounded focus:border-none focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-md"
                    />
                  )}

                  {/* Password Input */}
                  {field.type === "password" && (
                    <input
                      type="password"
                      name={field.name}
                      value={formResponses[field.name] || ""}
                      onChange={handleInputChange}
                      placeholder={
                        field.placeholder ||
                        `Enter your ${field.label.toLowerCase()}`
                      }
                      required={field.required}
                      className="border border-2 p-2 w-full rounded focus:border-none focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-md"
                    />
                  )}

                  {/* Number Input */}
                  {field.type === "number" && (
                    <input
                      type="number"
                      name={field.name}
                      value={formResponses[field.name] || ""}
                      onChange={handleInputChange}
                      onWheel={(e) => e.target.blur()}
                      required={field.required}
                      placeholder={
                        field.placeholder ||
                        `Enter your ${field.label.toLowerCase()}`
                      }
                      disabled={shouldDisableField(field.name)}
                      className={`border border-2 p-2 w-full rounded focus:outline-none focus:ring-2 shadow-md ${
                        shouldDisableField(field.name)
                          ? "bg-gray-200 cursor-not-allowed text-gray-500"
                          : "focus:border-none focus:ring-blue-400"
                      }`}
                    />
                  )}

                  {/* Date Input */}
                  {field.type === "date" && (
                    <input
                      type="date"
                      name={field.name}
                      value={formResponses[field.name] || ""}
                      onChange={handleInputChange}
                      required={field.required}
                      className="border border-2 p-2 w-full rounded focus:border-none focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-md"
                    />
                  )}

                  {/* Time Input */}
                  {field.type === "time" && (
                    <input
                      type="time"
                      name={field.name}
                      value={formResponses[field.name] || ""}
                      onChange={handleInputChange}
                      required={field.required}
                      className="border border-2 p-2 w-full rounded focus:border-none focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-md"
                    />
                  )}

                  {/* File Input */}
                  {field.type === "file" && (
                    <input
                      type="file"
                      name={field.name}
                      ref={(ref) => (fileInputRefs.current[field.name] = ref)}
                      onChange={handleInputChange}
                      required={field.required}
                      className="border border-2 p-2 w-full rounded focus:border-none focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-md"
                    />
                  )}

                  {/* Checkbox */}
                  {field.type === "checkbox" && (
                    <div className="col-span-2">
                      <input
                        type="checkbox"
                        name={field.name}
                        checked={formResponses[field.name] || false}
                        onChange={handleInputChange}
                        required={field.required}
                        className="mr-2"
                      />
                    </div>
                  )}

                  {/* Radio Buttons */}
                  {field.type === "radio" && field.options && (
                    <div className="space-y-2 col-span-2 flex gap-10 items-center font-bold">
                      {field.options.map((option, i) => (
                        <label key={i} className="flex items-center ">
                          <input
                            type="radio"
                            name={field.name}
                            value={option.value || option}
                            checked={
                              formResponses[field.name] ===
                              (option.value || option)
                            }
                            onChange={handleInputChange}
                            required={field.required}
                            className="mr-2 "
                          />
                          {option.label || option}
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Select Dropdown */}
                  {field.type === "select" && (
                    <>
                      <select
                        name={field.name}
                        value={formResponses[field.name] || ""}
                        onChange={handleInputChange}
                        required={field.required}
                        disabled={shouldDisableField(field.name)}
                        className={`border border-2 p-2 w-full rounded focus:outline-none focus:ring-2 shadow-md ${
                          shouldDisableField(field.name)
                            ? "bg-gray-200 cursor-not-allowed text-gray-500"
                            : "focus:border-none focus:ring-blue-400"
                        }`}
                      >
                        <option value="">
                          {field.placeholder ||
                            `Select ${field.label.toLowerCase()}`}
                        </option>
                        {[
                          ...(field.options || []),
                          ...(customOptions[field.name] || []),
                        ].map((option, i) => (
                          <option key={i} value={option.value || option}>
                            {option.label || option}
                          </option>
                        ))}
                        <option value="Other">Other</option>
                      </select>
                      {selectOthers[field.name] && (
                        <input
                          type="text"
                          placeholder="Enter other value"
                          className="mt-2 border border-gray-400 p-2 w-full rounded"
                          onBlur={(e) =>
                            handleOtherInput(field.name, e.target.value)
                          }
                          autoFocus
                        />
                      )}
                    </>
                  )}

                  {/* Textarea */}
                  {field.type === "textarea" && (
                    <textarea
                      name={field.name}
                      value={formResponses[field.name] || ""}
                      onChange={handleInputChange}
                      required={field.required}
                      placeholder={
                        field.placeholder ||
                        `Enter your ${field.label.toLowerCase()}`
                      }
                      rows={field.rows || 4}
                      className="border border-2 p-2 w-full rounded focus:border-none focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-md"
                    />
                  )}

                  {/* Range Slider */}
                  {field.type === "range" && (
                    <div>
                      <input
                        type="range"
                        name={field.name}
                        value={formResponses[field.name] || field.min || 0}
                        onChange={handleInputChange}
                        min={field.min || 0}
                        max={field.max || 100}
                        step={field.step || 1}
                        className="w-full"
                      />
                      <span>{formResponses[field.name] || field.min || 0}</span>
                    </div>
                  )}

                  {/* Color Picker */}
                  {field.type === "color" && (
                    <input
                      type="color"
                      name={field.name}
                      value={formResponses[field.name] || "#000000"}
                      onChange={handleInputChange}
                      required={field.required}
                      className="h-10 w-10"
                    />
                  )}

                  {errors[field.name] && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors[field.name]}
                    </p>
                  )}
                </div>
                {hasAddressFields() &&
                  field.name.toLowerCase().includes("permanent") &&
                  formData.fields[index + 1]?.name
                    .toLowerCase()
                    .includes("correspondence") && (
                    <div className="col-span-2 mb-2">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          name="sameAsPermanent"
                          checked={formResponses.sameAsPermanent || false}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setFormResponses((prev) => {
                              const updated = {
                                ...prev,
                                sameAsPermanent: checked,
                              };
                              if (checked) {
                                form.fields.forEach((field) => {
                                  const name = field.name.toLowerCase();
                                  if (name.includes("correspondence")) {
                                    const related = name.replace(
                                      "correspondence",
                                      "permanent"
                                    );
                                    updated[field.name] = prev[related] || "";
                                  }
                                });
                              } else {
                                form.fields.forEach((field) => {
                                  const name = field.name.toLowerCase();
                                  if (name.includes("correspondence")) {
                                    updated[field.name] = "";
                                  }
                                });
                              }
                              return updated;
                            });
                          }}
                          className="mr-2"
                        />
                        Same as Permanent Address
                      </label>
                    </div>
                  )}
              </React.Fragment>
            ))}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`bg-blue-500 text-white px-4 py-2 mt-4 rounded ${
    isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"
  }`}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserForm;
