import axios from "axios";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE_URL } from "../api/api";
import { useRef } from "react";
import { toast } from "react-toastify";

const UserForm = ({ fields: initialFields }) => {
  const { formId, submissionId } = useParams();
  const [formData, setFormData] = useState({});
  const [form, setForm] = useState(null);
  const [formResponses, setFormResponses] = useState({});
  const [errors, setErrors] = useState({});
  const [selectOthers, setSelectOthers] = useState({});
  const [customOptions, setCustomOptions] = useState({});
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [submitButtonText, setSubmitButtonText] = useState("Submit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingBNRC, setLoadingBNRC] = useState(false);
  const [slotCounts, setSlotCounts] = useState({});

  const fileInputRefs = useRef({});
  const fieldRefs = useRef({});
  const sectionRefs = useRef([]);

  useEffect(() => {
    if (!formId && !initialFields) return;

    const loadForm = async () => {
      try {
        let formData;

        if (formId) {
          const res = await axios.get(`${API_BASE_URL}/api/forms/${formId}`);
          formData = res.data;
        } else {
          formData = {
            sections: [
              {
                title: "Default Section",
                fields: initialFields || [],
              },
            ],
          };
        }
        const initialResponses = {};
        if (formData.sections) {
          formData.sections.forEach((section) => {
            section.fields.forEach((field) => {
              if (field.type === "checkbox" || field.type === "radio") {
                initialResponses[field.name] = false;
              } else if (field.type === "select-multiple") {
                initialResponses[field.name] = [];
              } else {
                const isYearField =
                  field.type === "number" &&
                  field.name.toLowerCase().includes("year") &&
                  field.name.toLowerCase().includes("pass");

                initialResponses[field.name] = isYearField ? 2000 : "";
              }
            });
          });
        }

        setForm(formData);
        setFormResponses(initialResponses);
        setFormData(formData);

        if (formData.paymentRequired && formData.paymentDetails) {
          setPaymentInfo(formData.paymentDetails);
          setSubmitButtonText("Submit & Proceed for Payment");
        } else {
          setSubmitButtonText("Submit");
        }
      } catch (error) {
        console.error("Error fetching form:", error);
      }
    };

    loadForm();
  }, [formId, initialFields]);

  useEffect(() => {
    if (!submissionId) return;

    const launchPayment = async () => {
      try {
        const { data } = await axios.get(
          `${API_BASE_URL}/api/submissions/${submissionId}`
        );

        if (!data.paymentDetails?.order_id) {
          toast.error("Invalid or expired payment link.");
          return;
        }

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: data.paymentDetails.amount,
          currency: "INR",
          name: "Form Submission",
          description: "Form Submission Payment",
          order_id: data.paymentDetails.order_id,
          handler: async (response) => {
            try {
              await axios.post(
                `${API_BASE_URL}/api/payment/payment-success/${submissionId}`,
                {
                  payment_id: response.razorpay_payment_id,
                  order_id: response.razorpay_order_id,
                  signature: response.razorpay_signature,
                }
              );
              toast.success("Payment successful!");
            } catch (err) {
              console.error("Payment verification failed", err);
              toast.error("Payment verification failed.");
            }
          },
          theme: { color: "#3399cc" },
          prefill: {
            name: data.responses?.name || "",
            email: data.responses?.email || "",
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } catch (err) {
        console.error("Failed to initiate payment:", err);
        toast.error("Could not load payment.");
      }
    };

    launchPayment();
  }, [submissionId]);

  useEffect(() => {
    if (!formResponses.sameAsPermanent) return;

    setFormResponses((prev) => {
      const updated = { ...prev };
      form.sections.forEach((section) => {
        section.fields.forEach((field) => {
          const name = field.name.toLowerCase();
          if (name.includes("correspondence")) {
            const relatedPermanentField = name.replace(
              "correspondence",
              "permanent"
            );
            updated[field.name] = prev[relatedPermanentField] || "";
          }
        });
      });
      return updated;
    });
  }, [
    formResponses.sameAsPermanent,
    formResponses.permanent_address_line1,
    formResponses.permanent_city,
    formResponses.permanent_state,
  ]);

  const hasAddressFields = () => {
    const fieldNames =
      form?.sections?.flatMap((section) =>
        section.fields.map((f) => f.name.toLowerCase())
      ) || [];
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
    if (/slot/i.test(name)) {
      const normalizedValue = value?.trim().toLowerCase();
      const normalizedCounts = Object.fromEntries(
        Object.entries(slotCounts).map(([k, v]) => [k.trim().toLowerCase(), v])
      );

      console.log("Checking slot:", normalizedValue, normalizedCounts);

      const slotCount = normalizedCounts[normalizedValue] || 0;
      console.log("slot count:", slotCount);

      if (slotCount >= 25) {
        toast.warn(
          `The slot "${value}" is already full. Please select another.`
        );
        return;
      }
    }

    setFormResponses((prev) => ({ ...prev, [name]: newValue }));

    if (e.target.tagName === "SELECT" && value === "Other") {
      setSelectOthers((prev) => ({ ...prev, [name]: true }));
    } else if (e.target.tagName === "SELECT") {
      setSelectOthers((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleOtherInput = (name, value) => {
    if (!value.trim()) return;
    const updatedForm = { ...form };
    updatedForm.sections.forEach((section) => {
      const fieldIndex = section.fields.findIndex((f) => f.name === name);
      if (fieldIndex !== -1) {
        const options = section.fields[fieldIndex].options || [];
        const alreadyExists = options.some(
          (opt) => (typeof opt === "string" ? opt : opt.value) === value
        );

        if (!alreadyExists) {
          section.fields[fieldIndex].options = [
            ...options,
            { label: value, value },
          ];
        }
      }
    });

    setForm(updatedForm);
    setFormResponses((prev) => ({ ...prev, [name]: value }));
    setSelectOthers((prev) => ({ ...prev, [name]: false }));
  };

  const validateForm = async () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[6-9]\d{9}$/;
    const aadhaarRegex = /^\d{12}$/;

    const allFields =
      form?.sections?.flatMap((section) => section.fields) || [];

    for (const field of allFields) {
      const value = formResponses[field.name];
      const lowerName = field.name.toLowerCase();
      const isAadhaarField = /(aadhaar|aadhar|adhar|adhaar)/i.test(lowerName);
      const isPhoneField = /(contact|phone|mobile)/i.test(lowerName);
      const isFileUpload = value instanceof File;

      if (
        field.required &&
        (!value || value === "" || (Array.isArray(value) && value.length === 0))
      ) {
        errors[field.name] = `${field.label} is required.`;
      }

      if (field.type === "email" && value && !emailRegex.test(value)) {
        errors[field.name] = "Invalid email format.";
      }

      if (isPhoneField && value && !phoneRegex.test(value)) {
        errors[field.name] = "Invalid contact number.";
      }

      // Phone uniqueness check
      if (isPhoneField && value) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/api/check-phone`, {
            formId: form?._id,
            phone: value,
          });

          if (data.exists) {
            errors[field.name] =
              "This phone number has already been used for this form.";
          }
        } catch (err) {
          console.error("Phone uniqueness check failed:", err);
        }
      }
      // Aadhar uniqueness check

      if (isAadhaarField && !isFileUpload && value) {
        if (!aadhaarRegex.test(value)) {
          errors[field.name] = "Aadhaar must be a 12-digit number.";
        } else {
          try {
            const { data } = await axios.post(
              `${API_BASE_URL}/api/check-aadhar`,
              {
                formId: form?._id,
                aadhar: value,
              }
            );

            if (data.exists) {
              errors[field.name] =
                "This Aadhaar number has already been used for this form.";
            }
          } catch (err) {
            console.error("Aadhaar uniqueness check failed:", err);
          }
        }
      }

      const isBnrcField = /(bnrc.*(number|no|reg))/i.test(lowerName);

      // bnrc uniqueness check
      if (isBnrcField && value && !isFileUpload) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/api/check-bnrc`, {
            formId: form?._id,
            bnrc: value,
          });

          if (data.exists) {
            errors[field.name] =
              "This BNRC registration number has already been used for this form.";
          }
        } catch (err) {
          console.error("BNRC uniqueness check failed:", err);
        }
      }
    }

    //  Slot capacity check
    const slotFieldName = Object.keys(formResponses).find((k) =>
      k.trim().toLowerCase().includes("slot")
    );
    const slotValue = formResponses[slotFieldName];

    if (slotValue) {
      const latestCounts = await fetchSlotCounts();
      const normalizedCounts = Object.fromEntries(
        Object.entries(latestCounts).map(([key, val]) => [
          key.trim().toLowerCase(),
          val,
        ])
      );
      const normalizedSlot = slotValue.trim().toLowerCase();
      const count = normalizedCounts[normalizedSlot] || 0;

      const MAX_PER_SLOT = 26;
      if (count >= MAX_PER_SLOT) {
        errors["slot"] = "This slot is already full. Please choose another.";
      }
    }

    return errors;
  };

  const fetchSlotCounts = async () => {
    if (!formId) {
      console.error("Form ID is missing, cannot fetch slot counts.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/slot-status/${formId}`);
      const data = await res.json();
      if (data.success) {
        const counts = {};
        data.slots.forEach((slot) => {
          if (slot._id) {
            const normalizedKey = slot._id.trim().toLowerCase();
            counts[normalizedKey] = slot.count;
          }
        });

        setSlotCounts(counts);
        return counts;
      }
    } catch (err) {
      console.error("Failed to fetch slot counts", err);
    }
  };

  useEffect(() => {
    if (formId) {
      console.log("formId before calling fetchSlotCounts:", formId);
      fetchSlotCounts();
    }
  }, [formId]);

  const handleBNRCChange = async (e) => {
    const bnrc = e.target.value;
    setFormResponses((prev) => ({
      ...prev,
      bnrc_registration_number: bnrc,
    }));

    if (bnrc.length >= 5) {
      // optional length check
      setLoadingBNRC(true);
      try {
        console.log("BNRC entered:", bnrc);

        const { data } = await axios.post(
          `${API_BASE_URL}/api/get-details-by-bnrc`,
          { bnrc: userInputBNRC }
        );
        if (data.success) {
          const prefilledData = data.data;
          setFormResponses((prev) => ({
            ...prev,
            ...prefilledData,
          }));
        } else {
          toast.info("No previous data found for this BNRC.");
        }
      } catch (err) {
        console.error("Error fetching BNRC details:", err);
        toast.error("Error fetching previous details. Try again later.");
      } finally {
        setLoadingBNRC(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const normalizeSlot = (slot) => (slot ? slot.trim().toLowerCase() : "");

    const latestCounts = await fetchSlotCounts();
    console.log("latest counts", latestCounts);

    const normalizedCounts = Object.fromEntries(
      Object.entries(latestCounts).map(([key, value]) => [
        normalizeSlot(key),
        value,
      ])
    );

    setSlotCounts(latestCounts);

    const validationErrors = await validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);

      const firstErrorField = Object.keys(validationErrors)[0];
      const errorElement = fieldRefs.current?.[firstErrorField];

      if (errorElement && errorElement.scrollIntoView) {
        errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
        errorElement.focus?.();
      }

      return;
    }

    try {
      const token = sessionStorage.getItem("token");
      const formData = new FormData();
      formData.append("form", form._id);

      const responses = {};

      Object.entries(formResponses).forEach(([fieldName, value]) => {
        if (typeof value === "string") {
          value = value.trim();
          if (
            /bnrc/i.test(fieldName) ||
            /phone/i.test(fieldName) ||
            /aadhaar/i.test(fieldName)
          ) {
            value = value.toLowerCase(); // optional, if backend does it
          }
        }

        if (value instanceof File) {
          formData.append(fieldName, value);
        } else {
          responses[fieldName] = value;
        }
      });

      formData.append("responses", JSON.stringify(responses));

      const slotFieldName = Object.keys(responses).find((k) =>
        k.trim().toLowerCase().includes("slot")
      );
      const selectedSlot = responses[slotFieldName];

      const normalizedSlot = normalizeSlot(selectedSlot);
      const slotCount = normalizedCounts[normalizedSlot] || 0;

      console.log("Checking slot:", selectedSlot, latestCounts);
      console.log("slot count:", slotCount);

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
        toast.success("Form submitted successfully!");
        if (response.data.paymentRequired) {
          toast.info("A payment link has been sent to your email.");
        }
        setFormResponses({});
        setErrors({});
        Object.values(fileInputRefs.current).forEach((input) => {
          if (input) input.value = "";
        });

        const submissionId = response.data.submission._id;
        if (response.data.paymentRequired) {
          const data = await axios.post(
            `${API_BASE_URL}/api/payment/create-order/${submissionId}`
          );

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

      setIsSubmitting(false);
    } catch (error) {
      console.error("Submission failed:", error);
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Something went wrong";
      toast.error(`${errorMsg}`);
      setIsSubmitting(false);
    }
  };

  const isExperienceZero = () => {
    let experienceField = null;

    // Loop through all sections and their fields
    form?.sections?.forEach((section) => {
      const foundField = section.fields?.find(
        (f) =>
          f.name.toLowerCase().includes("experience") && f.type === "number"
      );
      if (foundField && !experienceField) {
        experienceField = foundField;
      }
    });

    if (!experienceField) return false;

    const value = formResponses[experienceField.name];
    const normalizedValue = parseFloat(value);

    return !isNaN(normalizedValue) && normalizedValue === 0;
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
    <div className="relative mt-10 min-h-screen flex items-center justify-center bg-cover bg-center relative">
      <form
        onSubmit={handleSubmit}
        encType="multipart/form-data"
        className="w-full md:mx-[15%] sm:mx-auto bg-white p-8 rounded shadow-lg space-y-10"
      >
        {/* Form Title */}
        <h2 className="text-2xl font-bold text-center mb-6 bg-blue-900 p-2 text-white">
          {formData.formName}
        </h2>
        <div className="flex flex-wrap justify-start gap-2 mb-10 border-b-2">
          {formData?.sections?.map((section, index) => (
            <h3
              key={index}
              className="text-sm font-semibold capitalize py-1 px-2 bg-gray-200 text-gray-800 rounded mb-1 cursor-pointer hover:bg-gray-300"
              onClick={() =>
                sectionRefs.current[index]?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                })
              }
            >
              {section.sectionTitle}
            </h3>
          ))}
        </div>
        {/* Form Sections */}
        {formData?.sections?.map((section, sectionIndex) => {
          const hasFileField = section.fields.some((f) => f.type === "file");
          return (
          <div
            key={sectionIndex}
            ref={(el) => (sectionRefs.current[sectionIndex] = el)}
            className="space-y-4 border border-gray-300 rounded p-6 "
          >
            {/* Section Title */}
            <h3 className="bg-gray-200 text-gray-800 text-md font-bold uppercase px-4 py-2 rounded">
              {section.sectionTitle}
            </h3>

            {/* Fields Grid */}
            <div
              className={`w-full grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-${
                hasFileField ? 2 : 3
              }`}
            >
              <>
                {section.fields.map((field, fieldIndex) => {
                  const nameLower = field.name.toLowerCase();
                  const isPermanent = nameLower.includes("permanent");
                  const isCorrespondence = nameLower.includes("correspondence");

                  const hasCorrespondenceField = section.fields.some((f) =>
                    f.name.toLowerCase().includes("correspondence")
                  );

                  return (
                    <React.Fragment key={fieldIndex}>
                      <div
                        ref={(el) => {
                          if (el) fieldRefs.current[field.name] = el;
                        }}
                        className={`space-y-1 ${
                          field.type === "textarea" ? "sm:col-span-1 md:col-span-2 lg:col-span-3" : ""
                        }`}
                      >
                        <label className="block font-semibold uppercase text-sm text-gray-700">
                          {field.label}
                          {field.required && (
                            <span className="text-red-600 font-bold text-md">
                              {" "}
                              *
                            </span>
                          )}
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
                            className={`w-full border border-gray-300 rounded px-3 py-2 text-sm ${
                              shouldDisableField(field.name)
                                ? "bg-gray-100 text-gray-800 cursor-not-allowed"
                                : "focus:ring-blue-500"
                            }`}
                          />
                        )}

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
                            disabled={shouldDisableField(field.name)}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          />
                        )}

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
                            disabled={shouldDisableField(field.name)}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          />
                        )}

                        {field.type === "number" && (
                          <input
                            type="number"
                            name={field.name}
                            value={formResponses[field.name] || ""}
                            onChange={handleInputChange}
                            onWheel={(e) => e.target.blur()}
                            placeholder={
                              field.placeholder ||
                              `Enter your ${field.label.toLowerCase()}`
                            }
                            required={field.required}
                            disabled={shouldDisableField(field.name)}
                            className={`w-full border border-gray-300 rounded px-3 py-2 text-sm ${
                              shouldDisableField(field.name)
                                ? "bg-gray-100 text-gray-800 cursor-not-allowed"
                                : "focus:ring-blue-500"
                            }`}
                          />
                        )}

                        {field.type === "date" && (
                          <input
                            type="date"
                            name={field.name}
                            value={formResponses[field.name] || ""}
                            onChange={handleInputChange}
                            required={field.required}
                            disabled={shouldDisableField(field.name)}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          />
                        )}

                        {field.type === "time" && (
                          <input
                            type="time"
                            name={field.name}
                            value={formResponses[field.name] || ""}
                            onChange={handleInputChange}
                            required={field.required}
                            disabled={shouldDisableField(field.name)}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          />
                        )}

                        {field.type === "file" && (
                          <input
                            type="file"
                            name={field.name}
                            ref={(ref) =>
                              (fileInputRefs.current[field.name] = ref)
                            }
                            onChange={handleInputChange}
                            required={field.required}
                            disabled={shouldDisableField(field.name)}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          />
                        )}

                        {field.type === "checkbox" && (
                          <div>
                            <label className="inline-flex items-center">
                              <input
                                type="checkbox"
                                name={field.name}
                                checked={
                                  Array.isArray(formResponses[field.name])
                                    ? formResponses[field.name].includes(true)
                                    : formResponses[field.name] || false
                                }
                                onChange={handleInputChange}
                                required={
                                  field.required &&
                                  (!formResponses[field.name] ||
                                    (Array.isArray(formResponses[field.name]) &&
                                      formResponses[field.name].length === 0))
                                }
                                disabled={shouldDisableField(field.name)}
                                className="mr-2"
                              />
                              <span className="font-medium">{field.label}</span>
                            </label>
                          </div>
                        )}

                        {field.type === "radio" && field.options && (
                          <div className="flex gap-6">
                            {field.options.map((option, i) => (
                              <label
                                key={i}
                                className="flex items-center gap-2 font-medium"
                              >
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
                                  disabled={shouldDisableField(field.name)}
                                />
                                {option.label || option}
                              </label>
                            ))}
                          </div>
                        )}

                        {field.type === "select" && (
                          <>
                            <select
                              name={field.name}
                              value={formResponses[field.name] || ""}
                              onChange={handleInputChange}
                              required={field.required}
                              disabled={shouldDisableField(field.name)}
                              className={`w-full border border-gray-300 rounded px-3 py-2 text-sm ${
                                shouldDisableField(field.name)
                                  ? "bg-gray-100 text-gray-800 cursor-not-allowed"
                                  : "focus:ring-blue-500"
                              }`}
                            >
                              <option value="">
                                {field.placeholder ||
                                  `Select ${field.label.toLowerCase()}`}
                              </option>
                              {[
                                ...(field.options || []),
                                ...(customOptions[field.name] || []),
                              ].map((option, i) => {
                                const value = option.value || option;
                                const label = option.label || option;
                                const isSlotField = /slot/i.test(field.name);
                                const isFull =
                                  isSlotField &&
                                  slotCounts?.[value] >=
                                    (field.options.find(
                                      (opt) => opt.value === value
                                    )?.max || 25);
                                return (
                                  <option key={i} value={value}>
                                    {label} {isFull ? "(Full)" : ""}
                                  </option>
                                );
                              })}
                              {!/slot/i.test(field.name) && (
                                <option value="Other">Other</option>
                              )}
                            </select>

                            {selectOthers[field.name] && (
                              <input
                                type="text"
                                placeholder="Enter other value"
                                className="mt-2 w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                onBlur={(e) =>
                                  handleOtherInput(field.name, e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleOtherInput(
                                      field.name,
                                      e.target.value
                                    );
                                  }
                                }}
                                autoFocus
                              />
                            )}
                          </>
                        )}

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
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          />
                        )}

                        {field.type === "range" && (
                          <div>
                            <input
                              type="range"
                              name={field.name}
                              value={
                                formResponses[field.name] || field.min || 0
                              }
                              onChange={handleInputChange}
                              min={field.min || 0}
                              max={field.max || 100}
                              step={field.step || 1}
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                            />
                            <span>
                              {formResponses[field.name] || field.min || 0}
                            </span>
                          </div>
                        )}

                        {field.type === "color" && (
                          <input
                            type="color"
                            name={field.name}
                            value={formResponses[field.name] || "#000000"}
                            onChange={handleInputChange}
                            required={field.required}
                            className="h-10 w-10 rounded border border-gray-300"
                          />
                        )}

                        {errors[field.name] && (
                          <p className="text-red-600 text-sm mt-1">
                            {errors[field.name]}
                          </p>
                        )}
                      </div>
                      {isPermanent &&
                        hasCorrespondenceField &&
                        (fieldIndex + 1 === section.fields.length ||
                          (section.fields[fieldIndex + 1] &&
                            section.fields[fieldIndex + 1].name
                              .toLowerCase()
                              .includes("correspondence"))) && (
                          <div className="mb-4 col-span-full">
                            <label className="inline-flex items-center gap-2 cursor-pointer">
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

                                    const allFields =
                                      form?.sections?.flatMap(
                                        (section) => section.fields
                                      ) || [];

                                    if (checked) {
                                      allFields.forEach((field) => {
                                        const name = field.name.toLowerCase();
                                        if (name.includes("correspondence")) {
                                          const related = name.replace(
                                            "correspondence",
                                            "permanent"
                                          );
                                          updated[field.name] =
                                            prev[related] || "";
                                        }
                                      });
                                    } else {
                                      allFields.forEach((field) => {
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
                  );
                })}
              </>
            </div>
          </div>
        )
        })}

        {/* Slot Selection */}
        {formData.slotSelectionEnabled && (
          <div className="space-y-4 border border-gray-300 rounded p-6">
            <h3 className="bg-gray-200 text-gray-800 text-md font-bold uppercase px-4 py-2 rounded">
              Select Slot
            </h3>
            <select
              name="selectedSlot"
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="">Select a slot</option>
              {formData.availableSlots.map((slot, index) => (
                <option key={index} value={slot}>
                  {slot} ({slotCounts[slot] || 0}/25 filled)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end mt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`bg-blue-600 text-white px-6 py-2 rounded cursor-pointer ${
              isSubmitting
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-blue-700"
            }`}
          >
            {isSubmitting ? "Submitting..." : submitButtonText}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
