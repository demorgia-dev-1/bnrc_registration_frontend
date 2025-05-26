import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { API_BASE_URL } from "../api/api";

const ThankYou = () => {
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [isPaymentRequired, setIsPaymentRequired] = useState(false);
  const [formName, setFormName] = useState("");
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyPayment = async () => {
      const data = sessionStorage.getItem("razorpay_payment_response");
      if (!data) {
        setIsVerifying(false);
        return;
      }

      try {
        const parsed = JSON.parse(data);
        const {
          paymentRequired,
          formName: fname,
          razorpay_payment_id,
          razorpay_order_id,
          razorpay_signature,
          submissionId,
        } = parsed;

        setIsPaymentRequired(!!paymentRequired);

        if (!paymentRequired) {
          setFormName(fname || "your form");
          return;
        }

        const res = await axios.post(
          `${API_BASE_URL}/api/payment/payment-success/${submissionId}`,
          {
            payment_id: razorpay_payment_id,
            order_id: razorpay_order_id,
            signature: razorpay_signature,
          }
        );

        toast.success("Payment verified!");
        setPaymentVerified(true);
      } catch (err) {
        console.error("Verification failed", err);
        toast.error("Payment verification failed.");
      } finally {
        sessionStorage.removeItem("razorpay_payment_response");
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, []);

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
          <strong>{paymentVerified ? "successful" : "submitted"}</strong> and
          your form has been received.
        </p>
      ) : (
        <p className="text-lg mb-6">
          Your <strong>{formName || "form"}</strong> has been successfully
          submitted.
        </p>
      )}

      <p className="text-gray-600 mb-1">
        We appreciate your patience and support. If you have any questions, feel
        free to contact us.
      </p>
      <p className="text-gray-600 mb-6">You can now close this window.</p>
      <p className="text-gray-600 mb-8">Have a great day.</p>
    </div>
  );
};

export default ThankYou;
