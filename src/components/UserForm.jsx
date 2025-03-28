import axios from "axios";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const UserForm = ({ fields: initialFields }) => {
  const { formId } = useParams();
  const [formData, setFormData] = useState({});
  const [form, setForm] = useState(null);
  const [formResponses, setFormResponses] = useState({});
  const [errors, setErrors] = useState({});
  const [selectOthers, setSelectOthers] = useState({});
  const [customOptions, setCustomOptions] = useState({});
  const [paymentInfo, setPaymentInfo] = useState(null);

  useEffect(() => {
    if (!formId && !initialFields) return;

    const loadForm = async () => {
      try {
        let formData;

        if (formId) {
          const res = await axios.get(
            `http://localhost:5000/api/forms/${formId}`
          );
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

  function validateAadhaarNumber(aadhaar) {
    if (!/^\d{12}$/.test(aadhaar)) return false;
  
    const d = [
      [0,1,2,3,4,5,6,7,8,9],
      [1,2,3,4,0,6,7,8,9,5],
      [2,3,4,0,1,7,8,9,5,6],
      [3,4,0,1,2,8,9,5,6,7],
      [4,0,1,2,3,9,5,6,7,8],
      [5,9,8,7,6,0,4,3,2,1],
      [6,5,9,8,7,1,0,4,3,2],
      [7,6,5,9,8,2,1,0,4,3],
      [8,7,6,5,9,3,2,1,0,4],
      [9,8,7,6,5,4,3,2,1,0]
    ];
  
    const p = [
      [0,1,2,3,4,5,6,7,8,9],
      [1,5,7,6,2,8,3,0,9,4],
      [5,8,0,3,7,9,6,1,4,2],
      [8,9,1,6,0,4,3,5,2,7],
      [9,4,5,3,1,2,6,8,7,0],
      [4,2,8,6,5,7,3,9,0,1],
      [2,7,9,3,8,0,6,4,1,5],
      [7,0,4,6,9,1,3,2,5,8]
    ];
  
    const inv = [0,4,3,2,1,5,6,7,8,9];
  
    let c = 0;
    const reversed = aadhaar.split("").reverse().map(Number);
  
    for (let i = 0; i < reversed.length; i++) {
      c = d[c][p[i % 8][reversed[i]]];
    }
  
    return c === 0;
  }
  
  const checkAadhaarUniqueness = async (aadhaarFieldName, aadhaarValue) => {
    try {
      const res = await axios.post("http://localhost:5000/api/forms/check-aadhaar", {
        formId: form._id,
        aadhaar: aadhaarValue,
      });
  
      return res.data.exists;
    } catch (err) {
      console.error("Error checking Aadhaar uniqueness:", err);
      return false; // Let backend handle in case of error
    }
  };
  

  const validateForm = () => {
    const errors = {};
    const aadhaarRegex = /^\d{12}$/;
    const aadhaarFieldMatch = /(aadhaar|aadhar|adhar|adhaar)/i;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
    const phoneRegex = /^[6-9]\d{9}$/;

    form?.fields?.forEach((field) => {
      const value = formResponses[field.name];

      if (
        field.required &&
        (!value || value === "" || (Array.isArray(value) && value.length === 0))
      ) {
        errors[field.name] = `${field.label} is required.`;
      }

      if (field.type === "email" && value && !emailRegex.test(value)) {
        errors[field.name] = "Invalid email format.";
      }

      if (aadhaarFieldMatch.test(field.name) && value) {
        const valStr = value.toString();
        if (!/^\d+$/.test(valStr)) {
          errors[field.name] = "Aadhaar must contain only digits.";
        } else if (valStr.length !== 12) {
          errors[field.name] = "Aadhaar must be exactly 12 digits.";
        }
      }
          

      // const aadhaarFieldMatch = /(aadhaar|aadhar|adhar|adhaar)/i;

if (
  aadhaarFieldMatch.test(field.name) &&
  value &&
  !validateAadhaarNumber(value.toString())
) {
  errors[field.name] = "Invalid Aadhaar number. Please enter a valid 12-digit Aadhaar.";
}


      if (
        field.name.toLowerCase().includes("contact") &&
        value &&
        !phoneRegex.test(value)
      ) {
        errors[field.name] = "Invalid contact number.";
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
    // 1. Add to form's select field options dynamically
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

      // 2. Set the input value as selected
      setFormResponses((prev) => ({ ...prev, [name]: value }));

      // 3. Hide input box
      setSelectOthers((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
  if (Object.keys(validationErrors).length > 0) {
    setErrors(validationErrors);
    return;
  }

  // ✅ Step 2: Aadhaar uniqueness check
  // const aadhaarFieldName = form.fields.find(f =>
  //   /(aadhaar|aadhar|adhar)/i.test(f.name)
  // )?.name;

  // if (aadhaarFieldName) {
  //   const aadhaarValue = formResponses[aadhaarFieldName];
  //   if (aadhaarValue) {
  //     try {
  //       const aadhaarCheck = await axios.post("http://localhost:5000/api/forms/check-aadhaar", {
  //         formId: form._id,
  //         aadhaar: aadhaarValue,
  //       });

  //       if (aadhaarCheck.data.exists) {
  //         alert("This Aadhaar has already been used in this form.");
  //         return;
  //       }
  //     } catch (err) {
  //       console.error("Error checking Aadhaar uniqueness:", err);
  //       alert("Adhar number is already exist");
  //       return;
  //     }
  //   }
  // }
  // const emailFieldName = form.fields.find(f =>
  //   /email/i.test(f.name)
  // )?.name;
  
  // if (emailFieldName) {
  //   const emailValue = formResponses[emailFieldName];
  //   if (emailValue) {
  //     try {
  //       const emailCheck = await axios.post("http://localhost:5000/api/forms/check-email", {
  //         formId: form._id,
  //         email: emailValue,
  //       });
  
  //       if (emailCheck.data.exists) {
  //         alert("This email has already been used in this form.");
  //         return;
  //       }
  //     } catch (err) {
  //       console.error("Error checking email uniqueness:", err);
  //       alert("email id is already exist");
  //       return;
  //     }
  //   }
  // }

    try {
      
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
        `http://localhost:5000/api/submit-form/${form._id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (response.status === 201) {
        alert("Form submitted successfully!");
        const submissionId = response.data.submission._id;
        if(response.data.paymentRequired) {
          const data = await axios.post(
            `http://localhost:5000/api/payment/create-order/${submissionId}`,

          );
          console.log("data", data)
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
        // Open the receipt in a new tab
        // window.open(`http://localhost:5000/api/receipt/${submissionId}`, "_blank");
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error("Submission failed:", error);
      alert(
        `Submission failed: ${error.response?.data?.message || error.message}`
      );
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
    <div className="relative min-h-screen">
      <img
        src="/formpm.jpg"
        alt="form"
        className="w-full h-full object-cover absolute inset-0"
      />
      <div className="absolute inset-0 flex items-center justify-center z-10 w-full">
        <form
          onSubmit={handleSubmit}
          encType="multipart/form-data"
          className="bg-opacity-95 p-12 rounded-lg shadow-lg w-full max-w-[70%] max-h-[80vh] overflow-y-auto form bg-sky-50"
        >
          <h2 className="text-3xl text-center font-bold mb-10">
            {formData.formName}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {formData?.fields?.map((field, index) => (
              <React.Fragment key={index}>
                <div
                  className={`mb-4 ${
                    ["textarea"].includes(field.type) ? "col-span-2" : ""
                  }`}
                >
                  <label className="block font-bold capitalize">
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
    className="bg-blue-500 text-white px-4 py-2 mt-4"
  >
    Submit
  </button>
        </form>
      </div>
    </div>
  );
};

export default UserForm;
