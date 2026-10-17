import { useState, useCallback } from "react";
import type { VerifyResult } from "./auth-client";
import { OtpExpiredError, OtpInvalidError, NetworkError } from "./auth-client";

export type OtpLoginState =
  | "idle"
  | "sending"
  | "sent"
  | "verifying"
  | "success"
  | "expired"
  | "invalid"
  | "network-error";

export interface AuthClient {
  sendVerificationOTP(email: string): Promise<void>;
  verifyEmailOTP(email: string, otp: string): Promise<VerifyResult>;
}

export interface UseOtpLoginResult {
  state: OtpLoginState;
  email: string;
  error: string | null;
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<VerifyResult | null>;
  reset: () => void;
}

export function useOtpLogin(client: AuthClient): UseOtpLoginResult {
  const [state, setState] = useState<OtpLoginState>("idle");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sendOtp = useCallback(
    async (emailInput: string) => {
      setState("sending");
      setEmail(emailInput);
      setError(null);
      try {
        await client.sendVerificationOTP(emailInput);
        setState("sent");
      } catch (err) {
        if (err instanceof NetworkError) {
          setState("network-error");
          setError(err.message);
        } else {
          setState("network-error");
          setError(err instanceof Error ? err.message : "Connection error — check your internet.");
        }
      }
    },
    [client]
  );

  const verifyOtp = useCallback(
    async (otp: string) => {
      setState("verifying");
      setError(null);
      try {
        const result = await client.verifyEmailOTP(email, otp);
        setState("success");
        return result;
      } catch (err) {
        if (err instanceof OtpExpiredError) {
          setState("expired");
          setError(err.message);
        } else if (err instanceof OtpInvalidError) {
          setState("invalid");
          setError(err.message);
        } else {
          setState("network-error");
          setError(err instanceof Error ? err.message : "Connection error — check your internet.");
        }
        return null;
      }
    },
    [client, email]
  );

  const reset = useCallback(() => {
    setState("idle");
    setEmail("");
    setError(null);
  }, []);

  return { state, email, error, sendOtp, verifyOtp, reset };
}
