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

  async function verify(otp: string) {
    const result = await loginState.verifyOtp(otp);
    if (result?.token) {
      await login({
        token: result.token,
        userId: result.user?.id ?? "",
        email: result.user?.email ?? loginState.email
      });
    }
  }

  if (
    loginState.state === "sent" ||
    loginState.state === "verifying" ||
    loginState.state === "expired" ||
    loginState.state === "invalid"
  ) {
    return (
      <OtpScreen
        state={loginState.state}
        error={loginState.error}
        onVerify={verify}
        onResend={() => void loginState.sendOtp(loginState.email)}
      />
    );
  }

  return (
    <EmailScreen state={loginState.state} error={loginState.error} onSend={(email) => void loginState.sendOtp(email)} />
  );
}
