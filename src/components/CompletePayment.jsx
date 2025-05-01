import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../api/api";

const CompletePayment = () => {
  const [params] = useSearchParams();
  const submissionId = params.get("submissionId");

  useEffect(() => {
    const initiatePayment = async () => {
      try {
        const data = await axios.post(
            `${API_BASE_URL}/api/payment/create-order/${submissionId}`
          );
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: data.order.amount,
          currency: "INR",
          name: "Form Submission",
          order_id: data.order.id,
          handler: function (response) {
            alert("Payment successful!");
            // Optionally redirect or notify
          },
          theme: { color: "#3399cc" },
        };
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } catch (err) {
        console.error("Error launching Razorpay:", err);
      }
    };

    if (submissionId) {
      initiatePayment();
    }
  }, [submissionId]);

  return <div>Processing payment... Please wait.</div>;
};

export default CompletePayment;
