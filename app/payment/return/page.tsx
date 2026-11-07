"use client";

import { useEffect, useState } from "react";

type PaymentState = "checking" | "paid" | "error";

export default function PaymentReturnPage() {
  const [state, setState] = useState<PaymentState>("checking");
  const [message, setMessage] = useState(
    "Wir überprüfen deine PayPal-Zahlung."
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
            throw new Error("Ungültige Zahlungsdaten.");
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
            result?.error || "Die Zahlung konnte nicht bestätigt werden."
          );
        }

        sessionStorage.removeItem("pro1putt_pending_payment");
        sessionStorage.removeItem("pro1putt_resume_token");

        if (!cancelled) {
          setState("paid");
          setMessage(
            "Deine Zahlung wurde erfolgreich bestätigt. Vielen Dank!"
          );
        }
      } catch (error) {
        if (!cancelled) {
          setState("error");
          setMessage(
            error instanceof Error
              ? error.message
              : "Die Zahlung konnte nicht überprüft werden."
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
          ? "Zahlung wird geprüft"
          : state === "paid"
            ? "Zahlung erfolgreich"
            : "Zahlung noch nicht bestätigt"}
      </h1>

      <p style={{ lineHeight: 1.7 }}>{message}</p>

      {state === "error" && (
        <p>
          Bitte führe nicht sofort eine zweite Zahlung durch.
          Wir prüfen zunächst den bestehenden Zahlungsstatus.
        </p>
      )}

      <a href="/" style={{ color: "#00A65A" }}>
        Zurück zu PRO1PUTT
      </a>
    </main>
  );
}
