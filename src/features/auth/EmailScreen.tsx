import { useState } from "react";
import type { OtpLoginState } from "./useOtpLogin";

interface Props {
  state: OtpLoginState;
  error: string | null;
  onSend: (email: string) => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailScreen({ state, error, onSend }: Props) {
  const [email, setEmail] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const isBusy = state === "sending";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) {
      setValidationError("Please enter a valid email address.");
      return;
    }
    setValidationError(null);
    onSend(email);
  }

  return (
    <main style={{ maxWidth: 400, margin: "80px auto", padding: "0 16px" }}>
      <img src="/brand/zoe-agent.svg" alt="" width={48} height={48} style={{ marginBottom: 16 }} />
      <h1>Sign in to Zoe Agent</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email address</label>
        <br />
        <input
          id="email"
          type="email"
          autoFocus
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          disabled={isBusy}
          placeholder="you@example.com"
          style={{ width: "100%", marginTop: 4, marginBottom: 12, padding: "8px 10px" }}
        />
        {(validationError ?? error) && (
          <p role="alert" style={{ color: "red", marginBottom: 12 }}>
            {validationError ?? error}
          </p>
        )}
        <button type="submit" disabled={isBusy} style={{ width: "100%", padding: "10px 0" }}>
          {isBusy ? "Sending…" : "Send code"}
        </button>
      </form>
    </main>
  );
}
