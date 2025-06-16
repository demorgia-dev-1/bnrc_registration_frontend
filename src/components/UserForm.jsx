import axios from "axios";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE_URL } from "../api/api";
import { useRef } from "react";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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
  const [slotCounts, setSlotCounts] = useState({});
  const [fileErrors, setFileErrors] = useState([]);
  const [visibleSections, setVisibleSections] = useState([]);
  const [dateErrors, setDateErrors] = useState({});
  const [isCheckingExisting, setIsCheckingExisting] = useState(false);
  const [fetchedSubmissionId, setFetchedSubmissionId] = useState(null);

  const prevAadhaarRef = useRef();
  const prevContactRef = useRef();

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
            toast.success("Payment successful!");
            window.location.href = `/thankyou?submissionId=${submissionId}`;
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

  useEffect(() => {
    if (formData?.sections) {
      setVisibleSections(formData.sections.map(() => false));
    }
  }, [formData]);

useEffect(() => {
  const aadhar =
    formResponses["aadhaar"] ||
    formResponses["aadhaar_number"] ||
    formResponses["aadhar_number"] ||
    formResponses["adhar_number"];
  const contact =
    formResponses["contact"] ||
    formResponses["contact_number"] ||
    formResponses["phone"];

  // If Aadhaar/contact changed from what the loaded submission used, reset fetchedSubmissionId
  if (
    fetchedSubmissionId &&
    prevAadhaarRef.current !== undefined &&
    prevContactRef.current !== undefined &&
    (aadhar !== prevAadhaarRef.current || contact !== prevContactRef.current)
  ) {
    setFetchedSubmissionId(null);
  }

  if (
    aadhar &&
    contact &&
    !fetchedSubmissionId &&
    !isCheckingExisting &&
    formId
  ) {
    setIsCheckingExisting(true);

    axios
      .get(`${API_BASE_URL}/api/submissions/check-aadhar-contact`, {
        params: {
          aadhar,
          contact,
          formId,
        },
      })
      .then((res) => {
        if (res.data.success && ["Pending", "Failed"].includes(res.data.paymentStatus)) {
          setFetchedSubmissionId(res.data.submissionId);
          setFormResponses((prev) => ({
            ...prev,
            ...res.data.responses,
          }));
          toast.info("Previous form data loaded. You can now edit.");
          prevAadhaarRef.current = aadhar;
          prevContactRef.current = contact;
        }
      })
      .catch(() => {
        setFetchedSubmissionId(null);
      })
      .finally(() => {
        setIsCheckingExisting(false);
      });
  }

  // Update refs for next render
  prevAadhaarRef.current = aadhar;
  prevContactRef.current = contact;
}, [
  formResponses["aadhaar"],
  formResponses["aadhaar_number"],
  formResponses["aadhar_number"],
  formResponses["adhar_number"],
  formResponses["contact"],
  formResponses["contact_number"],
  formResponses["phone"],
  fetchedSubmissionId,
  isCheckingExisting,
  formId,
]);


  const toggleSection = (index) => {
    setVisibleSections((prev) =>
      prev.map((visible, i) => (i === index ? !visible : visible))
    );
  };

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

  const handleInputChange = async (e) => {
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
      // Weekend check for exam fields
      if (type === "date" && /exam/i.test(name)) {
        const selectedDate = new Date(value);
        const allowedDates = [
          new Date("2025-06-13"),
          new Date("2025-06-14"),
          new Date("2025-06-16"),
          new Date("2025-06-17"),
          new Date("2025-06-20"),
          new Date("2025-06-21"),
          new Date("2025-06-23"),
          new Date("2025-06-24"),
          new Date("2025-06-27"),
          new Date("2025-06-28"),
          new Date("2025-06-30"),
          new Date("2025-07-01"),
          new Date("2025-07-04"),
          new Date("2025-07-05"),
          new Date("2025-07-07"),
          new Date("2025-07-08"),
          new Date("2025-07-11"),
          new Date("2025-07-12"),
          new Date("2025-07-14"),
          new Date("2025-07-15"),
          new Date("2025-07-18"),
          new Date("2025-07-19"),
          new Date("2025-07-21"),
          new Date("2025-07-22"),
          new Date("2025-07-25"),
          new Date("2025-07-26"),
          new Date("2025-07-28"),
          new Date("2025-07-29"),
          new Date("2025-07-12"),
        ];

        const isAllowed = allowedDates.some(
          (d) =>
            d.getFullYear() === selectedDate.getFullYear() &&
            d.getMonth() === selectedDate.getMonth() &&
            d.getDate() === selectedDate.getDate()
        );
      }
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

    // Find the field definition
    const field = form?.sections
      ?.flatMap((s) => s.fields)
      .find((f) => f.name === name);
    if (field) {
      await validateForm(field, newValue);
    }

    // Handle "Other" selection visibility
    if (e.target.tagName === "SELECT" && value === "Other") {
      setSelectOthers((prev) => ({ ...prev, [name]: true }));
    } else if (e.target.tagName === "SELECT") {
      setSelectOthers((prev) => ({ ...prev, [name]: false }));
    }

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
      const isPhoneField = /(contact|phone|mobile)/i.test(lowerName);
      const isFileUpload =
        value instanceof File ||
        (Array.isArray(value) && value[0] instanceof File);
      const isAadhaarField = /(aadhaar|aadhar|adhar|adhaar)/i.test(lowerName);

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

      if (/dob|birth/i.test(field.name)) {
        const selectedDate = new Date(value);
        const cutoff = new Date();
        cutoff.setFullYear(cutoff.getFullYear() - 20);

        if (selectedDate > cutoff) {
          errors[field.name] = "You must be at least 20 years old to apply.";
        }
      }

      const isBnrcField = /(bnrc.*(number|no|reg))/i.test(lowerName);

      if (isPhoneField && value) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/api/check-phone`, {
            formId: form?._id,
            phone: value,
          });

          if (data.exists && data.submissionId !== fetchedSubmissionId) {
            errors[field.name] = "This contact number is already used.";
          }
        } catch (err) {
          console.error("Phone check failed:", err);
        }
      }

      // if (isAadhaarField && value) {
      //   if (!aadhaarRegex.test(value)) {
      //     errors[field.name] = "Aadhaar must be a 12-digit number.";
      //   } else {
      //     try {
      //       const { data } = await axios.post(
      //         `${API_BASE_URL}/api/check-aadhar`,
      //         {
      //           formId: form?._id,
      //           aadhar: value,
      //         }
      //       );

      //       if (data.exists && data.submissionId !== fetchedSubmissionId) {
      //         errors[field.name] = "This Aadhaar number is already used.";
      //       }
      //     } catch (err) {
      //       console.error("Aadhaar check failed:", err);
      //     }
      //   }
      // }

      if (isAadhaarField && value && field.type !== "file") {
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

            if (data.exists && data.submissionId !== fetchedSubmissionId) {
              errors[field.name] = "This Aadhaar number is already used.";
            }
          } catch (err) {
            console.error("Aadhaar check failed:", err);
          }
        }
      }

      if (isBnrcField && value) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/api/check-bnrc`, {
            formId: form?._id,
            bnrc: value,
          });

          if (data.exists && data.submissionId !== fetchedSubmissionId) {
            errors[field.name] = "This BNRC number is already used.";
          }
        } catch (err) {
          console.error("BNRC check failed:", err);
        }
      }
    }

    //  Slot capacity check
    // const slotFieldName = Object.keys(formResponses).find((k) =>
    //   k.trim().toLowerCase().includes("slot")
    // );
    // const slotValue = formResponses[slotFieldName];

    // if (slotValue) {
    //   const latestCounts = await fetchSlotCounts();
    //   const normalizedCounts = Object.fromEntries(
    //     Object.entries(latestCounts).map(([key, val]) => [
    //       key.trim().toLowerCase(),
    //       val,
    //     ])
    //   );
    //   const normalizedSlot = slotValue.trim().toLowerCase();
    //   const count = normalizedCounts[normalizedSlot] || 0;

    //   const MAX_PER_SLOT = 26;
    //   if (count >= MAX_PER_SLOT) {
    //     errors["slot"] = "This slot is already full. Please choose another.";
    //   }
    // }

    // Exam date limit check (max 2 per exam date per form)
    const examDateField = Object.keys(formResponses).find(
      (key) =>
        key.toLowerCase().includes("exam") && key.toLowerCase().includes("date")
    );

    if (examDateField) {
      const selectedDate = formResponses[examDateField];

      try {
        const { data } = await axios.get(
          `${API_BASE_URL}/api/exam-date-count`,
          {
            params: {
              formId: form._id,
              date: selectedDate,
              field: examDateField, // add this
            },
          }
        );

        if (data?.count >= 25) {
          errors[examDateField] =
            "This exam date is already full. Please choose another date.";
        }
      } catch (err) {
        console.error("Exam date availability check failed:", err);
      }
    }

    return errors;
  };

  const handleFieldValidation = async (fieldName) => {
    const allErrors = await validateForm();
    setErrors((prevErrors) => ({
      ...prevErrors,
      [fieldName]: allErrors[fieldName] || "",
    }));
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
        console.log("form response", formResponses);
        if (typeof value === "string") {
          value = value.trim();
          if (
            /bnrc/i.test(fieldName) ||
            /phone/i.test(fieldName) ||
            /aadhaar/i.test(fieldName)
          ) {
            value = value.toLowerCase();
          }
        }

        if (value instanceof File) {
          formData.append(fieldName, value);
        } else {
          responses[fieldName] = value;
        }
      });

      if (fetchedSubmissionId) {
        formData.append("submissionId", fetchedSubmissionId);
        console.log(
          "Submitting with fetchedSubmissionId:",
          fetchedSubmissionId
        );
      }

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
        console.log("Submission ID from server:", submissionId);
        sessionStorage.setItem("submissionId", submissionId);

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
            handler: async (response) => {
              try {
                window.location.href = `/thankyou?submissionId=${submissionId}`;
              } catch (err) {
                console.error("Payment handler error", err);
                toast.error("Payment succeeded, but redirection failed.");
              }
            },
          };

          const razorpay = new window.Razorpay(options);
          razorpay.open();
        } else {
          window.location.href = `/thankyou?submissionId=${submissionId}`;
        }

        setIsSubmitting(false);
      }
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

  const shouldDisableField = (fieldName, fieldType) => {
    const keywords = [
      "employer",
      "company",
      "designation",
      "job",
      "work",
      "employment",
      "experience_details",
    ];

    // Never disable file fields
    if (fieldType === "file") return false;

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
        {formData.instructionsTitle && (
          <p className="py-1 px-2 text-gray-700 text-start bg-gray-200 text-lg font-semibold">
            {formData.instructionsTitle}
          </p>
        )}
        {formData.generalInstructions && (
          <>
            <p className="mb-7 whitespace-pre-line text-gray-700 text-start text-sm font-semibold">
              {formData.generalInstructions}
            </p>
            <div className="border-b-2"></div>
          </>
        )}
        <div className="flex flex-wrap justify-start gap-2 mb-10 border-b-2">
          {formData?.sections?.map((section, index) => (
            <h3
              key={index}
              className="text-sm font-semibold capitalize py-1 px-2 bg-gray-200 text-gray-800 rounded mb-1 cursor-pointer hover:bg-gray-300"
              onClick={() => {
                sectionRefs.current[index]?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
                if (!visibleSections[index]) {
                  toggleSection(index);
                }
              }}
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
              <div
                onClick={() => toggleSection(sectionIndex)}
                className="flex justify-between items-center bg-gray-200 text-gray-800 text-md cursor-pointer font-bold uppercase px-4 py-2 rounded"
              >
                <span className="w-full">{section.sectionTitle}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSection(sectionIndex);
                  }}
                  className="ml-2 text-2xl text-black w-6 h-6 flex items-center justify-center cursor-pointer"
                  title={visibleSections[sectionIndex] ? "Minimize" : "Expand"}
                >
                  {visibleSections[sectionIndex] ? "−" : "+"}
                </button>
              </div>

              {/* Fields Grid */}
              {visibleSections[sectionIndex] && (
                <div
                  className={`w-full grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-${
                    hasFileField ? 2 : 3
                  }`}
                >
                  <>
                    {section.fields.map((field, fieldIndex) => {
                      const nameLower = field.name.toLowerCase();
                      const isPermanent = nameLower.includes("permanent");
                      const isCorrespondence =
                        nameLower.includes("correspondence");

                      const hasCorrespondenceField = section.fields.some((f) =>
                        f.name.toLowerCase().includes("correspondence")
                      );

                      return (
                        <React.Fragment key={fieldIndex}>
                          <div
                            ref={(el) => {
                              if (el) fieldRefs.current[field.name] = el;
                            }}
                            className={`w-full sm:col-span-1 md:col-span-2 ${
                              field.type === "textarea"
                                ? "lg:col-span-3"
                                : "lg:col-span-1"
                            } space-y-1 box-border`}
                          >
                            <label className="block font-semibold uppercase text-sm text-gray-700">
                              {field.label}
                              {field.required && (
                                <span className="text-red-600 font-bold text-md">
                                  {" "}
                                  *
                                </span>
                              )}
                              {field.type === "file" && (
                                <div className="flex items-center inline-block ml-1 relative">
                                  {/* Isolated icon for tooltip */}
                                  <div
                                    className="relative"
                                    onMouseEnter={(e) => {
                                      const tooltip =
                                        e.currentTarget.querySelector(
                                          ".file-tooltip"
                                        );
                                      tooltip?.classList.add("opacity-100");
                                    }}
                                    onMouseLeave={(e) => {
                                      const tooltip =
                                        e.currentTarget.querySelector(
                                          ".file-tooltip"
                                        );
                                      tooltip?.classList.remove("opacity-100");
                                    }}
                                    onFocus={(e) => {
                                      const tooltip =
                                        e.currentTarget.querySelector(
                                          ".file-tooltip"
                                        );
                                      tooltip?.classList.add("opacity-100");
                                    }}
                                    onBlur={(e) => {
                                      const tooltip =
                                        e.currentTarget.querySelector(
                                          ".file-tooltip"
                                        );
                                      tooltip?.classList.remove("opacity-100");
                                    }}
                                  >
                                    <svg
                                      className="w-4 h-4 text-gray-500 cursor-pointer"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                      tabIndex={0}
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M18 10A8 8 0 112 10a8 8 0 0116 0zm-9-1h2v5H9V9zm1-4a1 1 0 100 2 1 1 0 000-2z"
                                        clipRule="evenodd"
                                      />
                                    </svg>

                                    <div className="file-tooltip absolute z-10 w-64 p-2 text-xs text-white bg-black rounded opacity-0 transition-opacity duration-300 bottom-full left-1/2 transform -translate-x-1/2 mb-1 pointer-events-none">
                                      {/(certificate|cert)/i.test(field.name)
                                        ? "PDF only, max 5MB for certificates."
                                        : "JPG only, max 500KB for photos/signatures/Id."}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {field.type === "number" &&
                                field.label
                                  ?.toLowerCase()
                                  .includes("years of experience") && (
                                  <div className="relative ml-2 inline-flex items-center">
                                    <div className="relative cursor-pointer">
                                      <svg
                                        className="w-4 h-4 text-gray-500"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                        tabIndex={0}
                                        onFocus={(e) =>
                                          e.target.nextSibling.classList.add(
                                            "opacity-100"
                                          )
                                        }
                                        onBlur={(e) =>
                                          e.target.nextSibling.classList.remove(
                                            "opacity-100"
                                          )
                                        }
                                        onMouseEnter={(e) =>
                                          e.target.nextSibling.classList.add(
                                            "opacity-100"
                                          )
                                        }
                                        onMouseLeave={(e) =>
                                          e.target.nextSibling.classList.remove(
                                            "opacity-100"
                                          )
                                        }
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M18 10A8 8 0 112 10a8 8 0 0116 0zm-9-1h2v5H9V9zm1-4a1 1 0 100 2 1 1 0 000-2z"
                                          clipRule="evenodd"
                                        />
                                      </svg>

                                      <div className="absolute z-10 w-48 p-2 text-xs text-white bg-black rounded opacity-0 transition-opacity duration-300 bottom-full left-1/2 transform -translate-x-1/2 mb-1 pointer-events-none whitespace-normal">
                                        Write in the number of months.
                                      </div>
                                    </div>
                                  </div>
                                )}
                            </label>

                            {field.type === "text" && (
                              <input
                                type="text"
                                name={field.name}
                                value={formResponses[field.name] || ""}
                                onChange={handleInputChange}
                                onBlur={() => handleFieldValidation(field.name)}
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
                                onBlur={() => handleFieldValidation(field.name)}
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
                                onBlur={() => handleFieldValidation(field.name)}
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
                              <div className="relative w-full">
                                <input
                                  type="number"
                                  name={field.name}
                                  value={formResponses[field.name] || ""}
                                  onChange={(e) => {
                                    const value = e.target.value;

                                    if (/^-/.test(value)) return;
                                    if (/^0\d+/.test(value)) return;

                                    handleInputChange(e);
                                  }}
                                  onWheel={(e) => e.target.blur()}
                                  onBlur={() =>
                                    handleFieldValidation(field.name)
                                  }
                                  placeholder={
                                    field.placeholder ||
                                    `Enter your ${field.label.toLowerCase()}`
                                  }
                                  required={field.required}
                                  disabled={shouldDisableField(field.name)}
                                  className={`w-full pr-24 border border-gray-300 rounded px-3 py-2 text-sm ${
                                    shouldDisableField(field.name)
                                      ? "bg-gray-100 text-gray-800 cursor-not-allowed"
                                      : "focus:ring-blue-500"
                                  }`}
                                  min={0}
                                  step="1"
                                />

                                {/* Dropdown inside input (absolute positioned) */}
                                {field.label
                                  ?.toLowerCase()
                                  .includes("years of experience") && (
                                  <select
                                    name={`${field.name}_unit`}
                                    value={
                                      formResponses[`${field.name}_unit`] || " "
                                    }
                                    onChange={(e) =>
                                      handleInputChange({
                                        target: {
                                          name: `${field.name}_unit`,
                                          value: e.target.value,
                                        },
                                      })
                                    }
                                    // className="absolute right-1 top-1/2 transform -translate-y-1/2 focus:outline-none border-l border-gray-300 bg-white rounded px-2 py-1 text-sm h-[30px]"
                                    className="absolute right-2 top-[3px] focus:outline-none bg-white rounded px-2 py-[5px] text-sm h-[32px] w-[70px]"
                                  >
                                    <option value=""></option>
                                    <option value="months">Months</option>
                                    <option value="years">Years</option>
                                  </select>
                                )}

                                {/* Instructions below input */}
                                {field.label === "Years of Experience" && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    Please enter the number and select months or
                                    years.
                                  </p>
                                )}
                              </div>
                            )}

                            {field.type === "date" && (
                              <div>
                                {/exam/i.test(field.name) ? (
                                  <DatePicker
                                    selected={
                                      formResponses[field.name]
                                        ? new Date(formResponses[field.name])
                                        : null
                                    }
                                    onChange={(date) => {
                                      setDateErrors((prev) => ({
                                        ...prev,
                                        [field.name]: "",
                                      }));

                                      const formatDate = (d) => {
                                        if (!d) return "";
                                        const year = d.getFullYear();
                                        const month = String(
                                          d.getMonth() + 1
                                        ).padStart(2, "0");
                                        const day = String(
                                          d.getDate()
                                        ).padStart(2, "0");
                                        return `${year}-${month}-${day}`;
                                      };

                                      handleInputChange({
                                        target: {
                                          name: field.name,
                                          value: date ? formatDate(date) : "",
                                          type: "date",
                                        },
                                      });
                                    }}
                                    includeDates={(() => {
                                      const allowedDays = [1, 2, 5, 6]; // Mon, Tue, Fri, Sat
                                      const start = new Date("2025-06-01");
                                      const end = new Date("2025-07-31");
                                      const todayStr = new Date()
                                        .toISOString()
                                        .split("T")[0];
                                      const result = [];

                                      for (
                                        let d = new Date(start);
                                        d <= end;
                                        d.setDate(d.getDate() + 1)
                                      ) {
                                        const dateStr = d
                                          .toISOString()
                                          .split("T")[0];

                                        if (
                                          dateStr === "2025-06-13" ||
                                          (dateStr >= "2025-06-25" &&
                                            dateStr <= "2025-07-03") ||
                                          dateStr === todayStr
                                        ) {
                                          continue;
                                        }

                                        if (allowedDays.includes(d.getDay())) {
                                          result.push(new Date(d));
                                        }
                                      }

                                      return result;
                                    })()}
                                    minDate={new Date()}
                                    showMonthDropdown
                                    showYearDropdown
                                    dropdownMode="select"
                                    placeholderText="Select exam date"
                                    dateFormat="yyyy-MM-dd"
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                    required={field.required}
                                    disabled={shouldDisableField(field.name)}
                                  />
                                ) : (
                                  <DatePicker
                                    selected={
                                      formResponses[field.name]
                                        ? new Date(formResponses[field.name])
                                        : null
                                    }
                                    onChange={(date) => {
                                      const today = new Date();
                                      const cutoff = new Date();
                                      cutoff.setFullYear(
                                        today.getFullYear() - 20
                                      );
                                      cutoff.setDate(cutoff.getDate());

                                      if (date > cutoff) {
                                        setDateErrors((prev) => ({
                                          ...prev,
                                          [field.name]:
                                            "You must be nearly 20 years old to apply.",
                                        }));
                                        return;
                                      }

                                      setDateErrors((prev) => ({
                                        ...prev,
                                        [field.name]: "",
                                      }));

                                      const formatDate = (d) => {
                                        if (!d) return "";
                                        const year = d.getFullYear();
                                        const month = String(
                                          d.getMonth() + 1
                                        ).padStart(2, "0");
                                        const day = String(
                                          d.getDate()
                                        ).padStart(2, "0");
                                        return `${year}-${month}-${day}`;
                                      };

                                      handleInputChange({
                                        target: {
                                          name: field.name,
                                          value: date ? formatDate(date) : "",
                                          type: "date",
                                        },
                                      });
                                    }}
                                    maxDate={(() => {
                                      const date = new Date();
                                      date.setFullYear(date.getFullYear() - 20);
                                      date.setDate(date.getDate());
                                      return date;
                                    })()}
                                    placeholderText="Select date of birth"
                                    dateFormat="yyyy-MM-dd"
                                    showMonthDropdown
                                    showYearDropdown
                                    dropdownMode="select"
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                    required={field.required}
                                    disabled={shouldDisableField(field.name)}
                                  />
                                )}

                                {dateErrors[field.name] && (
                                  <p className="text-red-500 text-xs mt-1">
                                    {dateErrors[field.name]}
                                  </p>
                                )}
                              </div>
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
                              <>
                                <input
                                  type="file"
                                  name={field.name}
                                  ref={(ref) =>
                                    (fileInputRefs.current[field.name] = ref)
                                  }
                                  accept={
                                    /(certificate|cert)/i.test(field.name)
                                      ? ".pdf"
                                      : ".jpg"
                                  }
                                  // accept=".jpg,.jpeg,.pdf"
                                  multiple
                                  onChange={handleInputChange}
                                  //  onBlur={() => handleFieldValidation(field.name)}
                                  required={field.required}
                                  disabled={shouldDisableField(
                                    field.name,
                                    field.type
                                  )}
                                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                />
                                {(field.name === "workExperienceCertificates" ||
                                  /work experience/i.test(field.label)) && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    Attach all work experience certificates from
                                    previous employers. For current employer, if
                                    work experience certification is not
                                    available, attach the joining letter as
                                    proof. Please ensure all work experience
                                    certificates are merged into a single PDF.
                                  </p>
                                )}
                              </>
                            )}
                            {fileErrors[field.name] &&
                              fileErrors[field.name].map((err, idx) => (
                                <div
                                  key={idx}
                                  className="text-red-500 text-xs mt-1"
                                >
                                  {err}
                                </div>
                              ))}

                            {field.type === "checkbox" && (
                              <div>
                                <label className="inline-flex items-center">
                                  <input
                                    type="checkbox"
                                    name={field.name}
                                    checked={
                                      Array.isArray(formResponses[field.name])
                                        ? formResponses[field.name].includes(
                                            true
                                          )
                                        : formResponses[field.name] || false
                                    }
                                    onChange={handleInputChange}
                                    required={
                                      field.required &&
                                      (!formResponses[field.name] ||
                                        (Array.isArray(
                                          formResponses[field.name]
                                        ) &&
                                          formResponses[field.name].length ===
                                            0))
                                    }
                                    disabled={shouldDisableField(field.name)}
                                    className="mr-2"
                                  />
                                  <span className="font-medium">
                                    {field.label}
                                  </span>
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

                                  {/year.*pass/i.test(field.name)
                                    ? Array.from({ length: 26 }, (_, i) => {
                                        const year = 2025 - i;
                                        return (
                                          <option key={year} value={year}>
                                            {year}
                                          </option>
                                        );
                                      })
                                    : [
                                        ...(field.options || []),
                                        ...(customOptions[field.name] || []),
                                      ].map((option, i) => {
                                        const value = option.value || option;
                                        const label = option.label || option;
                                        const isSlotField = /slot/i.test(
                                          field.name
                                        );
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
                                </select>
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
                                // className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-y"
                                className="w-full max-w-full box-border border border-gray-300 rounded px-3 py-2 text-sm resize-y break-words"
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
                                    checked={
                                      formResponses.sameAsPermanent || false
                                    }
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
                                            const name =
                                              field.name.toLowerCase();
                                            if (
                                              name.includes("correspondence")
                                            ) {
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
                                            const name =
                                              field.name.toLowerCase();
                                            if (
                                              name.includes("correspondence")
                                            ) {
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
              )}
            </div>
          );
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
        {isSubmitting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300 ease-in-out">
            <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full text-center animate-fadeInUp">
              <h2 className="text-xl font-bold text-gray-800 mb-3">
                Please wait...
              </h2>
              <p className="text-gray-600 mb-4">
                Do not close the window. Form submission in progress..
              </p>
              <div className="flex justify-center">
                <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default UserForm;
