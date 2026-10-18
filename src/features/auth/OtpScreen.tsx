import { useState, useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, Inbox, LoaderCircle } from "lucide-react";
import type { OtpLoginState } from "./useOtpLogin";

interface Props {
  state: OtpLoginState;
  error: string | null;
  email: string;
  isSigningIn: boolean;
  onVerify: (otp: string) => void;
  onResend: () => void;
  onChangeEmail: () => void;
}

export function OtpScreen({ state, error, email, isSigningIn, onVerify, onResend, onChangeEmail }: Props) {
  const [otp, setOtp] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const isBusy = state === "verifying" || state === "sending" || isSigningIn;
  const hasInvalidCode = state === "invalid" || state === "expired";

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isBusy && otp.length === 6) onVerify(otp);
  }

  return (
    <>
      <div className="auth-step-icon" aria-hidden="true">
        <Inbox size={20} />
      </div>
      <h2>Check your inbox.</h2>
      <p className="auth-description">
        Enter the six-digit code we sent to <strong>{email}</strong>.
      </p>
      <form onSubmit={handleSubmit} className="auth-form" aria-busy={isBusy}>
        <label htmlFor="otp">Sign-in code</label>
        <input
          id="otp"
          ref={inputRef}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.currentTarget.value.replace(/\D/g, ""))}
          disabled={isBusy}
          placeholder="000000"
          className="auth-input auth-input-code"
          aria-invalid={hasInvalidCode}
          aria-describedby={error ? "otp-error" : undefined}
          required
        />
        {error && (
          <p id="otp-error" role="alert" className="auth-error">
            {error}
          </p>
        )}
        <button type="submit" disabled={isBusy || otp.length !== 6} className="auth-submit">
          {isBusy && <LoaderCircle size={16} className="auth-spinner" aria-hidden="true" />}
          {isSigningIn ? "Signing you in…" : state === "verifying" ? "Verifying…" : "Sign in to Zoe Agent"}
          {!isBusy && <ArrowRight size={16} aria-hidden="true" />}
        </button>
      </form>
      <div className="auth-code-actions">
        <p>
          Didn’t get it?{" "}
          <button
            type="button"
            disabled={isBusy}
            className="auth-text-button"
            onClick={() => {
              setOtp("");
              onResend();
            }}
          >
            {state === "sending" ? "Sending…" : "Resend code"}
          </button>
        </p>
        <button type="button" disabled={isBusy} className="auth-text-button auth-back-button" onClick={onChangeEmail}>
          <ArrowLeft size={13} aria-hidden="true" /> Use a different email
        </button>
      </div>
    </>
  );
}
