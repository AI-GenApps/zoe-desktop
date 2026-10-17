import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOtpLogin } from "../features/auth/useOtpLogin";
import { OtpExpiredError, OtpInvalidError, NetworkError } from "../features/auth/auth-client";
import type { AuthClient } from "../features/auth/useOtpLogin";

function makeClient(overrides: Partial<AuthClient> = {}): AuthClient {
  return {
    sendVerificationOTP: vi.fn().mockResolvedValue(undefined),
    verifyEmailOTP: vi.fn().mockResolvedValue({ token: "tok123" }),
    ...overrides
  };
}

describe("useOtpLogin", () => {
  let client: AuthClient;

  beforeEach(() => {
    client = makeClient();
  });

  it("starts in idle state", () => {
    const { result } = renderHook(() => useOtpLogin(client));
    expect(result.current.state).toBe("idle");
  });

  it("transitions idle → sending → sent on successful sendOtp", async () => {
    const { result } = renderHook(() => useOtpLogin(client));
    await act(async () => {
      await result.current.sendOtp("user@example.com");
    });
    expect(result.current.state).toBe("sent");
    expect(result.current.email).toBe("user@example.com");
  });

  it("transitions sent → verifying → success on correct OTP", async () => {
    const { result } = renderHook(() => useOtpLogin(client));
    await act(async () => {
      await result.current.sendOtp("user@example.com");
    });
    let verifyResult: Awaited<ReturnType<typeof result.current.verifyOtp>>;
    await act(async () => {
      verifyResult = await result.current.verifyOtp("123456");
    });
    expect(result.current.state).toBe("success");
    expect(verifyResult!).toEqual({ token: "tok123" });
  });

  it("transitions to expired state on OtpExpiredError", async () => {
    client = makeClient({
      verifyEmailOTP: vi.fn().mockRejectedValue(new OtpExpiredError())
    });
    const { result } = renderHook(() => useOtpLogin(client));
    await act(async () => {
      await result.current.sendOtp("user@example.com");
    });
    await act(async () => {
      await result.current.verifyOtp("000000");
    });
    expect(result.current.state).toBe("expired");
    expect(result.current.error).toBe("Code expired — resend?");
  });

  it("transitions to invalid state on OtpInvalidError", async () => {
    client = makeClient({
      verifyEmailOTP: vi.fn().mockRejectedValue(new OtpInvalidError())
    });
    const { result } = renderHook(() => useOtpLogin(client));
    await act(async () => {
      await result.current.sendOtp("user@example.com");
    });
    await act(async () => {
      await result.current.verifyOtp("999999");
    });
    expect(result.current.state).toBe("invalid");
    expect(result.current.error).toBe("Incorrect code. Try again.");
  });

  it("transitions to network-error on NetworkError during send", async () => {
    client = makeClient({
      sendVerificationOTP: vi.fn().mockRejectedValue(new NetworkError())
    });
    const { result } = renderHook(() => useOtpLogin(client));
    await act(async () => {
      await result.current.sendOtp("user@example.com");
    });
    expect(result.current.state).toBe("network-error");
    expect(result.current.error).toBe("Connection error — check your internet.");
  });

  it("transitions to network-error on NetworkError during verify", async () => {
    client = makeClient({
      verifyEmailOTP: vi.fn().mockRejectedValue(new NetworkError())
    });
    const { result } = renderHook(() => useOtpLogin(client));
    await act(async () => {
      await result.current.sendOtp("user@example.com");
    });
    await act(async () => {
      await result.current.verifyOtp("123456");
    });
    expect(result.current.state).toBe("network-error");
  });

  it("reset() returns to idle and clears email/error", async () => {
    client = makeClient({
      sendVerificationOTP: vi.fn().mockRejectedValue(new NetworkError())
    });
    const { result } = renderHook(() => useOtpLogin(client));
    await act(async () => {
      await result.current.sendOtp("user@example.com");
    });
    expect(result.current.state).toBe("network-error");
    act(() => {
      result.current.reset();
    });
    expect(result.current.state).toBe("idle");
    expect(result.current.email).toBe("");
    expect(result.current.error).toBeNull();
  });
});
