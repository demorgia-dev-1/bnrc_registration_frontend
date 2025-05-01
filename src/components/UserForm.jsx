import axios from "axios";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE_URL } from "../api/api";
import { useRef } from "react";
import { toast } from "react-toastify";

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
  const [loadingBNRC, setLoadingBNRC] = useState(false);
  const [slotCounts, setSlotCounts] = useState({});

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
    if (!value.trim()) return; // Ignore empty input
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
  const validateForm = async () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[6-9]\d{9}$/;
    const aadhaarRegex = /^\d{12}$/;

    for (const field of form?.fields || []) {
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

      if (isAadhaarField && !isFileUpload && value) {
        if (!aadhaarRegex.test(value)) {
          errors[field.name] = "Aadhaar must be a 12-digit number.";
        }
      }
      const isBnrcField = /(bnrc.*(number|no|reg))/i.test(lowerName);

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
    fetchSlotCounts();
  }, []);

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
        >
          <h2 className="text-2xl md:text-3xl text-center font-bold mb-10">
            {formData.formName}
          </h2>

          <div className="flex flex-wrap justify-between gap-4 w-full">
            {formData?.fields?.map((field, index) => (
              <React.Fragment key={index}>
                <div
                  className={`mb-4 ${
                    field.type === "textarea"
                      ? "w-full"
                      : "w-full sm:basis-[48%] sm:max-w-[48%]"
                  }`}
                >
                  <label className="block font-bold capitalize mb-2">
                    {field.label} :
                    {field.required && (
                      <span className="text-xl text-red-500"> *</span>
                    )}
                  </label>
                  {loadingBNRC && (
                    <div style={{ fontSize: "0.8em", color: "#888" }}>
                      Fetching details...
                    </div>
                  )}

                  {field.type === "text" && (
                    <input
                      type="text"
                      name={field.name}
                      value={formResponses[field.name] || ""}
                      onChange={(e) => {
                        handleInputChange(e);
                        // const name = field.name.toLowerCase();
                        // if (/(bnrc.*(number|no|reg))/i.test(name)) {
                        //   handleBNRCChange(e);
                        // }
                      }}
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
                        ].map((option, i) => {
                          const value = option.value || option;
                          const label = option.label || option;
                          const isSlotField = /slot/i.test(field.name);
                          const isFull =
                            isSlotField &&
                            slotCounts?.[value] >=
                              (field.options.find((opt) => opt.value === value)
                                ?.max || 25);
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
                          className="mt-2 border border-gray-400 p-2 w-full rounded"
                          onBlur={(e) =>
                            handleOtherInput(field.name, e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault(); // ✅ Prevent page refresh
                              handleOtherInput(field.name, e.target.value);
                            }
                          }}
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
              isSubmitting
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-blue-600"
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
