"use client";

import { useEffect, useState } from "react";

type Language = "de" | "en";
type PaymentState = "idle" | "loading" | "error";

type PendingPayment = {
  registration_id: string;
  payment_token: string;
};

function getPendingPayment(): PendingPayment | null {
  try {
    const saved = sessionStorage.getItem("pro1putt_pending_payment");
    if (!saved) return null;

    const payment: unknown = JSON.parse(saved);

    if (
      !payment ||
      typeof payment !== "object" ||
      !("registration_id" in payment) ||
      !("payment_token" in payment) ||
      typeof payment.registration_id !== "string" ||
      typeof payment.payment_token !== "string"
    ) {
      return null;
    }

    return {
      registration_id: payment.registration_id,
      payment_token: payment.payment_token,
    };
  } catch {
    return null;
  }
}

export default function PaymentCancelPage() {
  const [language, setLanguage] = useState<Language>("en");
  const [state, setState] = useState<PaymentState>("idle");
  const [canResume, setCanResume] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const de = language === "de";

  useEffect(() => {
    const lang =
      sessionStorage.getItem("pro1putt_payment_language") === "de"
        ? "de"
        : "en";

    setLanguage(lang);

    const resumeToken = sessionStorage.getItem("pro1putt_resume_token");
    const hasResumeToken =
      Boolean(resumeToken) && /^[a-f0-9]{64}$/i.test(resumeToken!);

    setCanResume(hasResumeToken || getPendingPayment() !== null);
  }, []);

  async function resumePayment() {
    if (state === "loading") return;

    setState("loading");
    setErrorMessage("");

    const resumeToken = sessionStorage.getItem("pro1putt_resume_token");

    if (resumeToken && /^[a-f0-9]{64}$/i.test(resumeToken)) {
      window.location.assign(
        `/payment/resume#token=${resumeToken}&lang=${language}`
      );
      return;
    }

    const payment = getPendingPayment();

    if (!payment) {
      setErrorMessage(
        de
          ? "Die Zahlungsdaten sind nicht mehr verfügbar. Bitte kontaktiere PRO1PUTT."
          : "Your payment details are no longer available. Please contact PRO1PUTT."
      );
      setState("error");
      return;
    }

    try {
      const response = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(payment),
      });

      const result = await response.json();

      if (!response.ok || !result?.order_id || !Array.isArray(result?.links)) {
        throw new Error(
          result?.error ||
            (de
              ? "Die Zahlung konnte nicht wiederaufgenommen werden."
              : "The payment could not be resumed.")
        );
      }

      const approvalUrl = Array.isArray(result.links)
        ? result.links.find(
            (link: { rel?: string; href?: string }) =>
              (link.rel === "approve" || link.rel === "payer-action") &&
              typeof link.href === "string" &&
              (
                link.href.startsWith("https://www.sandbox.paypal.com/") ||
                link.href.startsWith("https://www.paypal.com/")
              )
          )?.href
        : null;

      if (!approvalUrl) {
        throw new Error(
          de
            ? "PayPal hat keinen gültigen Zahlungslink zurückgegeben. Bitte kontaktiere PRO1PUTT."
            : "PayPal did not return a valid payment link. Please contact PRO1PUTT."
        );
      }

      sessionStorage.setItem("pro1putt_payment_language", language);
      window.location.assign(approvalUrl);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : de
            ? "Die Zahlung konnte nicht wiederaufgenommen werden."
            : "The payment could not be resumed."
      );
      setState("error");
    }
  }

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
        {de ? "Zahlung nicht abgeschlossen" : "Payment Not Completed"}
      </h1>

      <p style={{ lineHeight: 1.7 }}>
        {de
          ? "Deine PayPal-Zahlung wurde nicht abgeschlossen. Deine Anmeldung bleibt zunächst bis zum Ablauf der Zahlungsfrist vorgemerkt."
          : "Your PayPal payment was not completed. Your registration remains pending until the payment deadline."}
      </p>

      <p style={{ lineHeight: 1.7 }}>
        {de
          ? "Du kannst deine Zahlung innerhalb der Zahlungsfrist fortsetzen. Eine erneute Anmeldung ist nicht notwendig."
          : "You can continue your payment within the payment deadline. You do not need to register again."}
      </p>

      {canResume && (
        <button
          type="button"
          disabled={state === "loading"}
          onClick={resumePayment}
          style={{
            background: "#00C46A",
            color: "#0E2A1F",
            border: "none",
            borderRadius: 8,
            padding: "15px 28px",
            fontSize: 16,
            fontWeight: 700,
            cursor: state === "loading" ? "wait" : "pointer",
            opacity: state === "loading" ? 0.6 : 1,
          }}
        >
          {state === "loading"
            ? de
              ? "PayPal wird vorbereitet ..."
              : "Preparing PayPal ..."
            : de
              ? "Zahlung mit PayPal fortsetzen"
              : "Continue Payment with PayPal"}
        </button>
      )}

      {state === "error" && (
        <p role="alert" style={{ color: "#B42318", marginTop: 24 }}>
          {errorMessage}
        </p>
      )}

      {!canResume && (
        <p>
          {de
            ? "Deine Zahlungsdaten sind in diesem Browser nicht mehr verfügbar. Bitte verwende den Zahlungslink aus deiner Erinnerung oder kontaktiere PRO1PUTT."
            : "Your payment details are no longer available in this browser. Please use your payment reminder link or contact PRO1PUTT."}
        </p>
      )}

      <p style={{ marginTop: 32 }}>
        <a href={de ? "/de" : "/"} style={{ color: "#008A4D" }}>
          {de ? "Zurück zu PRO1PUTT" : "Back to PRO1PUTT"}
        </a>
      </p>
    </main>
  );
}
