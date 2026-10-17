import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendVerificationOTP, verifyEmailOTP } from "./auth-client";

describe("auth client email OTP requests", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("sends a Better Auth sign-in OTP request", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));

    await sendVerificationOTP("user@example.com");

    expect(fetchMock).toHaveBeenCalledWith(
      "undefined/api/auth/email-otp/send-verification-otp",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "user@example.com", type: "sign-in" })
      })
    );
  });

  it("verifies a Better Auth sign-in OTP request", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ token: "session-token" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    );

    await verifyEmailOTP("user@example.com", "123456");

    expect(fetchMock).toHaveBeenCalledWith(
      "undefined/api/auth/sign-in/email-otp",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "user@example.com", type: "sign-in", otp: "123456" })
      })
    );
  });
});
