"use client";

import { useEffect, useState } from "react";

type PaymentState = "checking" | "paid" | "error";

export default function PaymentReturnPage() {
  const [state, setState] = useState<PaymentState>("checking");
  const [message, setMessage] = useState(
    "We are checking your PayPal payment."
  );

  useEffect(() => {
    let cancelled = false;

    async function verifyPayment() {
      const saved = sessionStorage.getItem("pro1putt_pending_payment");
      const resumeToken = sessionStorage.getItem("pro1putt_resume_token");

      if (!saved && !resumeToken) {
        if (!cancelled) {
          setState("error");
          setMessage(
            "Die Zahlungsdaten wurden nicht gefunden. Bitte kontaktiere PRO1PUTT."
          );
        }
        return;
      }

      try {
        let endpoint: string;
        let payload: object;

        if (resumeToken) {
          endpoint = "/api/paypal/capture-resume";
          payload = { resume_token: resumeToken };
        } else {
          const payment = JSON.parse(saved!);

          if (
            typeof payment.registration_id !== "string" ||
            typeof payment.payment_token !== "string"
          ) {
            throw new Error("Invalid payment details.");
          }

          endpoint = "/api/paypal/capture-order";
          payload = payment;
        }

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!response.ok || result?.status !== "paid") {
          throw new Error(
            result?.error || "The payment could not be confirmed."
          );
        }

        sessionStorage.removeItem("pro1putt_pending_payment");
        sessionStorage.removeItem("pro1putt_resume_token");

        if (!cancelled) {
          setState("paid");
          setMessage(
            "Your payment has been confirmed. Thank you!"
          );
        }
      } catch (error) {
        if (!cancelled) {
          setState("error");
          setMessage(
            error instanceof Error
              ? error.message
              : "The payment could not be verified."
          );
        }
      }
    }

    verifyPayment();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main
      style={{
        maxWidth: 650,
        margin: "100px auto",
        padding: 30,
        textAlign: "center",
        fontFamily: "Lato, sans-serif",
      }}
    >
      <h1 style={{ color: "#0E2A1F" }}>
        {state === "checking"
          ? "Payment Under Review"
          : state === "paid"
            ? "Zahlung erfolgreich"
            : "Payment Not Yet Confirmed"}
      </h1>

      <p style={{ lineHeight: 1.7 }}>{message}</p>

      {state === "error" && (
        <p>
          Please do not make a second payment immediately.
          We are checking your existing payment status first.
        </p>
      )}

      <a href="/" style={{ color: "#00A65A" }}>
        Back to PRO1PUTT
      </a>
    </main>
  );
}
