import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { API_BASE_URL } from "../api/api";

const ThankYou = () => {
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [isPaymentRequired, setIsPaymentRequired] = useState(false);
  const [formName, setFormName] = useState("");
  const [isVerifying, setIsVerifying] = useState(true);
  const submissionId =
    new URLSearchParams(window.location.search).get("submissionId") ||
    sessionStorage.getItem("submissionId");

  console.log("Submission ID:", submissionId);

  useEffect(() => {
    if (!submissionId) return;

    let intervalId = null;

    const checkPaymentStatus = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/payment/submissions/${submissionId}/status`
        );

        const {
          paymentRequired,
          paymentStatus,
          formName: fetchedFormName,
        } = response.data;

        setFormName(fetchedFormName || "");

        if (!paymentRequired) {
          setPaymentVerified(true);
          setIsPaymentRequired(false);
          setIsVerifying(false);
          if (intervalId) clearInterval(intervalId);
        } else {
          setIsPaymentRequired(true);
          if (paymentStatus === "Completed") {
            setPaymentVerified(true);
            setIsVerifying(false);
            if (intervalId) clearInterval(intervalId);
          } else if (paymentStatus === "Failed") {
            setPaymentVerified(false);
            setIsVerifying(false);
            if (intervalId) clearInterval(intervalId);
          } else {
            setIsVerifying(true);
          }
        }
      } catch (error) {
        console.error("Failed to check payment status", error);
        toast.error("Failed to verify payment status");
        setIsVerifying(false);
        if (intervalId) clearInterval(intervalId);
      }
    };

    // Initial check
    checkPaymentStatus();

    // Poll every 3 seconds
    intervalId = setInterval(checkPaymentStatus, 3000);

    // Cleanup on unmount
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [submissionId]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-center p-6">
      <h1 className="text-4xl font-bold mb-6 text-green-600">Thank You!</h1>

      {isVerifying ? (
        <p className="text-lg mb-6 text-gray-700">
          Verifying your payment, please wait...
        </p>
      ) : isPaymentRequired ? (
        <p className="text-lg mb-6">
          Your payment was{" "}
          <strong>{paymentVerified ? "successful" : "unsuccessful"}</strong> and
          your <strong>{formName || "form"}</strong> form has been received.
        </p>
      ) : (
        <p className="text-lg mb-6">
          Your <strong>{formName || "form"}</strong> form has been successfully
          submitted.
        </p>
      )}
      <p className="text-gray-600 mb-1">
        Your admit card has been mailed. Thank you for registering.
      </p>
      <p className="text-gray-600 mb-1">
        We wish you all the best.
      </p>
      
      <p className="text-gray-600 mb-6">You can now close this window.</p>
      <p className="text-gray-600 mb-8">Have a great day.</p>
    </div>
  );
};

export default ThankYou;
