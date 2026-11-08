"use client";

import { useEffect, useState } from "react";

type PaymentState = "checking" | "ready" | "redirecting" | "error";
type Language = "de" | "en";

export default function PaymentResumePage() {
  const [state, setState] = useState<PaymentState>("checking");
  const [language, setLanguage] = useState<Language>("en");
  const [resumeToken, setResumeToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const token = fragment.get("token");
    const lang = fragment.get("lang") === "de" ? "de" : "en";

    setLanguage(lang);
    window.history.replaceState(null, "", window.location.pathname);

    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
      setState("error");
      setErrorMessage(
        lang === "de"
          ? "Dieser Zahlungslink ist ungültig."
          : "This payment link is invalid."
      );
      return;
    }

    setResumeToken(token);
    setState("ready");
  }, []);

  async function continuePayment() {
    if (!resumeToken || state === "redirecting") return;

    setState("redirecting");

    try {
      const response = await fetch("/api/paypal/resume-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ resume_token: resumeToken }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(
          result.error ||
            (language === "de"
              ? "Die Zahlung konnte nicht vorbereitet werden."
              : "The payment could not be prepared.")
        );
      }

      const approveUrl = result.links?.find(
        (link: { rel: string; href: string }) =>
          link.rel === "payer-action" || link.rel === "approve"
      )?.href;

      if (
        typeof approveUrl !== "string" ||
        !(
          approveUrl.startsWith("https://www.sandbox.paypal.com/") ||
          approveUrl.startsWith("https://www.paypal.com/")
        )
      ) {
        throw new Error("PayPal did not return a valid payment link.");
      }

      sessionStorage.setItem("pro1putt_resume_token", resumeToken);
      sessionStorage.setItem("pro1putt_payment_language", language);
      sessionStorage.removeItem("pro1putt_pending_payment");

      window.location.assign(approveUrl);
    } catch (error) {
      setState("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Payment could not be prepared."
      );
    }
  }

  const de = language === "de";

  return (
    <main style={{
      maxWidth: 650, margin: "90px auto", padding: 30,
      textAlign: "center", fontFamily: "Lato, sans-serif"
    }}>
      <h1 style={{ color: "#0E2A1F" }}>
        {de ? "PRO1PUTT – Turnieranmeldung" : "PRO1PUTT – Tournament Registration"}
      </h1>

      {state === "checking" && (
        <p>{de ? "Dein Zahlungslink wird geprüft." : "We are checking your payment link."}</p>
      )}

      {state === "ready" && (
        <>
          <p style={{ lineHeight: 1.7 }}>
            {de
              ? "Du kannst deine Turnieranmeldung jetzt sicher über PayPal bezahlen."
              : "You can now securely pay for your tournament registration via PayPal."}
          </p>
          <button onClick={continuePayment} style={{
            background: "#00C46A", color: "#0E2A1F",
            border: "none", borderRadius: 8, padding: "15px 28px",
            fontSize: 16, fontWeight: 700, cursor: "pointer"
          }}>
            {de ? "Jetzt mit PayPal bezahlen" : "Pay securely with PayPal"}
          </button>
        </>
      )}

      {state === "redirecting" && (
        <p>{de ? "PayPal wird vorbereitet. Bitte warten ..." : "Preparing PayPal. Please wait ..."}</p>
      )}

      {state === "error" && (
        <>
          <p style={{ lineHeight: 1.7 }}>{errorMessage}</p>
          <p>
            {de
              ? "Bitte starte nicht sofort eine zweite Zahlung. Kontaktiere bei Fragen PRO1PUTT."
              : "Please do not immediately start another payment. Contact PRO1PUTT if you need help."}
          </p>
        </>
      )}
    </main>
  );
}
