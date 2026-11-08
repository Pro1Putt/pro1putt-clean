"use client";

import { useEffect, useState } from "react";

type PaymentState = "checking" | "paid" | "error";
type Language = "de" | "en";

export default function PaymentReturnPage() {
  const [state, setState] = useState<PaymentState>("checking");
  const [language, setLanguage] = useState<Language>("en");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const lang: Language =
      sessionStorage.getItem("pro1putt_payment_language") === "de" ? "de" : "en";

    setLanguage(lang);

    async function verifyPayment() {
      const saved = sessionStorage.getItem("pro1putt_pending_payment");
      const resumeToken = sessionStorage.getItem("pro1putt_resume_token");

      if (!saved && !resumeToken) {
        if (!cancelled) {
          setState("error");
          setErrorMessage(
            lang === "de"
              ? "Die Zahlungsdaten wurden nicht gefunden. Bitte kontaktiere PRO1PUTT."
              : "Payment details could not be found. Please contact PRO1PUTT."
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
          cache: "no-store",
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!response.ok || result?.status !== "paid") {
          throw new Error(
            result?.error ||
              (lang === "de"
                ? "Die Zahlung konnte nicht bestätigt werden."
                : "The payment could not be confirmed.")
          );
        }

        sessionStorage.removeItem("pro1putt_pending_payment");
        sessionStorage.removeItem("pro1putt_resume_token");

        if (!cancelled) setState("paid");
      } catch (error) {
        if (!cancelled) {
          setState("error");
          setErrorMessage(
            error instanceof Error
              ? error.message
              : lang === "de"
                ? "Der Zahlungsstatus konnte nicht geprüft werden."
                : "The payment status could not be verified."
          );
        }
      }
    }

    void verifyPayment();

    return () => {
      cancelled = true;
    };
  }, []);

  const de = language === "de";

  return (
    <main style={{
      maxWidth: 650, margin: "100px auto", padding: 30,
      textAlign: "center", fontFamily: "Lato, sans-serif"
    }}>
      <h1 style={{ color: "#0E2A1F" }}>
        {state === "checking"
          ? (de ? "Zahlung wird überprüft" : "Checking Your Payment")
          : state === "paid"
            ? (de ? "Zahlung erfolgreich" : "Payment Successful")
            : (de ? "Zahlung noch nicht bestätigt" : "Payment Not Yet Confirmed")}
      </h1>

      <p style={{ lineHeight: 1.7 }}>
        {state === "checking"
          ? (de ? "Wir überprüfen deine PayPal-Zahlung." : "We are verifying your PayPal payment.")
          : state === "paid"
            ? (de
                ? "Deine Zahlung wurde bestätigt. Vielen Dank! Du erhältst deine Anmeldebestätigung per E-Mail."
                : "Your payment has been confirmed. Thank you! Your registration confirmation will be sent by email.")
            : errorMessage}
      </p>

      {state === "error" && (
        <p>
          {de
            ? "Bitte führe nicht sofort eine zweite Zahlung durch. Kontaktiere PRO1PUTT, damit der Zahlungsstatus geprüft werden kann."
            : "Please do not immediately make a second payment. Contact PRO1PUTT so your payment status can be checked."}
        </p>
      )}

      <a href="/" style={{ color: "#008A4D" }}>
        {de ? "Zurück zu PRO1PUTT" : "Back to PRO1PUTT"}
      </a>
    </main>
  );
}
