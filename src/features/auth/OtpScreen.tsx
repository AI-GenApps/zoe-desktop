import { useState, useEffect, useRef } from "react";
import type { OtpLoginState } from "./useOtpLogin";

interface Props {
  state: OtpLoginState;
  error: string | null;
  onVerify: (otp: string) => void;
  onResend: () => void;
}

const STATE_MESSAGES: Partial<Record<OtpLoginState, string>> = {
  expired: "Code expired — resend?",
  invalid: "Incorrect code. Try again.",
  "network-error": "Connection error — check your internet."
};

export function OtpScreen({ state, error, onVerify, onResend }: Props) {
  const [otp, setOtp] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const isBusy = state === "verifying";

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length === 6) onVerify(otp);
  }

  const displayMessage = STATE_MESSAGES[state] ?? error;

  return (
    <main style={{ maxWidth: 400, margin: "80px auto", padding: "0 16px" }}>
      <h1>Check your email for a 6-digit code</h1>
      <p style={{ color: "#555" }}>Enter the code we sent to your email address.</p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="otp">6-digit code</label>
        <br />
        <input
          id="otp"
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.currentTarget.value.replace(/\D/g, ""))}
          disabled={isBusy}
          placeholder="000000"
          style={{ width: "100%", marginTop: 4, marginBottom: 12, padding: "8px 10px", letterSpacing: "0.3em" }}
        />
        {displayMessage && (
          <p role="alert" style={{ color: state === "network-error" ? "orange" : "red", marginBottom: 12 }}>
            {displayMessage}
          </p>
        )}
        <button type="submit" disabled={isBusy || otp.length !== 6} style={{ width: "100%", padding: "10px 0" }}>
          {isBusy ? "Verifying…" : "Verify"}
        </button>
      </form>
      <p style={{ marginTop: 16, textAlign: "center" }}>
        <button
          type="button"
          onClick={onResend}
          style={{
            background: "none",
            border: "none",
            color: "#0070f3",
            cursor: "pointer",
            textDecoration: "underline"
          }}
        >
          Resend code
        </button>
      </p>
    </main>
  );
}
