import { useState } from "react";
import { AuthLayout } from "@/features/auth/AuthLayout";
import { EmailScreen } from "@/features/auth/EmailScreen";
import { OtpScreen } from "@/features/auth/OtpScreen";
import { useOtpLogin } from "@/features/auth/useOtpLogin";
import * as authClient from "@/features/auth/auth-client";
import { useAuth } from "@/hooks/useAuth";

const client = {
  sendVerificationOTP: authClient.sendVerificationOTP,
  verifyEmailOTP: authClient.verifyEmailOTP
};

export default function Login() {
  const loginState = useOtpLogin(client);
  const { login } = useAuth();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  async function sendCode(nextEmail: string) {
    setEmail(nextEmail);
    setSessionError(null);
    if (await loginState.sendOtp(nextEmail)) setStep("code");
  }

  async function verify(otp: string) {
    setSessionError(null);
    const result = await loginState.verifyOtp(otp);
    if (!result) return;
    if (!result.token) {
      setSessionError("We couldn’t complete sign-in. Please request a new code.");
      return;
    }
    setIsSigningIn(true);
    try {
      await login({
        token: result.token,
        userId: result.user?.id ?? "",
        email: result.user?.email ?? loginState.email
      });
    } catch {
      setSessionError("We couldn’t save your session. Please try signing in again.");
    } finally {
      setIsSigningIn(false);
    }
  }

  return (
    <AuthLayout>
      {step === "code" ? (
        <OtpScreen
          state={loginState.state}
          error={sessionError ?? loginState.error}
          email={email}
          isSigningIn={isSigningIn}
          onVerify={verify}
          onResend={() => void sendCode(email)}
          onChangeEmail={() => {
            loginState.reset();
            setSessionError(null);
            setStep("email");
          }}
        />
      ) : (
        <EmailScreen
          state={loginState.state}
          error={loginState.error}
          initialEmail={email}
          onSend={(nextEmail) => void sendCode(nextEmail)}
        />
      )}
    </AuthLayout>
  );
}
