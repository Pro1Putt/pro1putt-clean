"use client";

import { useEffect, useState } from "react";

type PaymentState = "checking" | "ready" | "redirecting" | "error";

export default function PaymentResumePage() {
  const [state, setState] = useState<PaymentState>("checking");
  const [message, setMessage] = useState(
    "We are checking your payment link."
  );
  const [resumeToken, setResumeToken] = useState<string | null>(null);

  useEffect(() => {
    const fragment = window.location.hash.slice(1);
    const params = new URLSearchParams(fragment);
    const token = params.get("token");

    window.history.replaceState(
      null,
      "",
      window.location.pathname
    );

    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
      setState("error");
      setMessage("This payment link is invalid.");
      return;
    }

    setResumeToken(token);
    setState("ready");
    setMessage(
      "You can now pay securely for your tournament registration via PayPal."
    );
  }, []);

  async function continuePayment() {
    if (!resumeToken || state === "redirecting") return;

    setState("redirecting");
    setMessage("Deine PayPal-Zahlung wird vorbereitet.");

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
          result.error || "Die Zahlung konnte nicht vorbereitet werden."
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
        throw new Error(
          "PayPal did not return a valid payment link."
        );
      }

      sessionStorage.setItem("pro1putt_resume_token", resumeToken);
      sessionStorage.removeItem("pro1putt_pending_payment");

      window.location.assign(approveUrl);
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Die Zahlung konnte nicht vorbereitet werden."
      );
    }
  }

  return (
    <main
      style={{
        maxWidth: 650,
        margin: "90px auto",
        padding: 30,
        textAlign: "center",
        fontFamily: "Lato, sans-serif",
      }}
    >
      <h1 style={{ color: "#0E2A1F" }}>
        PRO1PUTT – Tournament Registration
      </h1>

      <p style={{ lineHeight: 1.7 }}>{message}</p>

      {state === "ready" && (
        <button
          onClick={continuePayment}
          style={{
            background: "#00C46A",
            color: "#0E2A1F",
            border: "none",
            borderRadius: 8,
            padding: "15px 28px",
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Jetzt mit PayPal bezahlen
        </button>
      )}

      {state === "redirecting" && (
        <p>Bitte warte einen Moment ...</p>
      )}

      {state === "error" && (
        <p>
          Bitte versuche nicht mehrfach zu bezahlen.
          Kontaktiere bei Fragen PRO1PUTT.
        </p>
      )}
    </main>
  );
}
