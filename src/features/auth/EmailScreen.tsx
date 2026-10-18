import { useState } from "react";
import { ArrowRight, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import type { OtpLoginState } from "./useOtpLogin";

interface Props {
  state: OtpLoginState;
  error: string | null;
  onSend: (email: string) => void;
  initialEmail?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailScreen({ state, error, onSend, initialEmail = "" }: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isBusy = state === "sending";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isBusy) return;
    const normalizedEmail = email.trim();
    if (!EMAIL_RE.test(normalizedEmail)) {
      setValidationError("Please enter a valid email address.");
      return;
    }
    setValidationError(null);
    onSend(normalizedEmail);
  }

  return (
    <>
      <div className="auth-step-icon" aria-hidden="true">
        <Mail size={20} />
      </div>
      <h2>Welcome to your workday.</h2>
      <p className="auth-description">Sign in with your workspace email. We’ll send you a code to get started.</p>
      <form onSubmit={handleSubmit} className="auth-form" aria-busy={isBusy}>
        <label htmlFor="email">Email address</label>
        <div className="auth-input-wrap">
          <Mail className="auth-input-icon" size={16} aria-hidden="true" />
          <input
            id="email"
            type="email"
            autoFocus
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.currentTarget.value);
              setValidationError(null);
            }}
            disabled={isBusy}
            placeholder="you@example.com"
            className="auth-input auth-input-email"
            aria-invalid={Boolean(validationError)}
            aria-describedby={(validationError ?? error) ? "email-error" : undefined}
            required
          />
        </div>
        {(validationError ?? error) && (
          <p id="email-error" role="alert" className="auth-error">
            {validationError ?? error}
          </p>
        )}
        <button type="submit" disabled={isBusy} className="auth-submit">
          {isBusy && <LoaderCircle size={16} className="auth-spinner" aria-hidden="true" />}
          {isBusy ? "Sending your code…" : "Continue with email"}
          {!isBusy && <ArrowRight size={16} aria-hidden="true" />}
        </button>
      </form>
      <p className="auth-form-note">
        <LockKeyhole size={13} aria-hidden="true" />A one-time code. No password to remember.
      </p>
    </>
  );
}
