import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/secure-storage", () => ({
  loadSessionToken: vi.fn().mockResolvedValue("session-token")
}));

describe("auth client email OTP requests", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.resetModules();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("VITE_API_BASE_URL", undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it.each([
    ["missing", undefined, "https://zoe.w3dev.app"],
    ["empty", "", "https://zoe.w3dev.app"],
    ["whitespace", " \t ", "https://zoe.w3dev.app"],
    ["explicit local override", "http://localhost:4510", "http://localhost:4510"],
    ["normalized override", " https://preview.example.com/member/// ", "https://preview.example.com/member"]
  ])(
    "uses the %s API configuration consistently for auth, member and quit traffic",
    async (_name, configured, base) => {
      vi.stubEnv("VITE_API_BASE_URL", configured);
      const { sendVerificationOTP, verifyEmailOTP } = await import("./auth-client");
      const { apiFetch } = await import("@/lib/api-client");
      const { handleQuit } = await import("@/lib/quit");
      const { invoke } = await import("@tauri-apps/api/core");
      fetchMock
        .mockResolvedValueOnce(Response.json({ success: true }))
        .mockResolvedValueOnce(Response.json({ token: "session-token" }))
        .mockResolvedValueOnce(Response.json({ guilds: [] }));

      await sendVerificationOTP("user@example.com");
      expect(await verifyEmailOTP("user@example.com", "123456")).toEqual({ token: "session-token", user: undefined });
      await apiFetch("/api/member/guilds");
      await handleQuit();

      expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
        `${base}/api/auth/email-otp/send-verification-otp`,
        `${base}/api/auth/sign-in/email-otp`,
        `${base}/api/member/guilds`
      ]);
      expect(invoke).toHaveBeenCalledWith(
        "send_quit_heartbeat",
        expect.objectContaining({
          endpoint: `${base}/api/member/heartbeat`,
          authorizationHeader: "Bearer session-token"
        })
      );
    }
  );

  it("accepts the Better Auth JSON acknowledgement and sends sign-in request bodies", async () => {
    const { sendVerificationOTP, verifyEmailOTP } = await import("./auth-client");
    fetchMock
      .mockResolvedValueOnce(Response.json({ success: true }))
      .mockResolvedValueOnce(Response.json({ token: "session-token" }));

    await expect(sendVerificationOTP("user@example.com")).resolves.toBeUndefined();
    await verifyEmailOTP("user@example.com", "123456");

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://zoe.w3dev.app/api/auth/email-otp/send-verification-otp",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "user@example.com", type: "sign-in" })
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://zoe.w3dev.app/api/auth/sign-in/email-otp",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "user@example.com", type: "sign-in", otp: "123456" })
      })
    );
  });

  it.each([
    ["the desktop HTML shell", '<!doctype html><html><body><div id="root"></div></body></html>', "text/html"],
    ["an empty response", "", "application/json"],
    ["malformed JSON", "{", "application/json"],
    ["a missing acknowledgement", "{}", "application/json"],
    ["a negative acknowledgement", '{"success":false}', "application/json"],
    ["a string instead of a boolean", '{"success":"true"}', "application/json"],
    ["null JSON", "null", "application/json"],
    ["an array instead of an acknowledgement", '[{"success":true}]', "application/json"]
  ])("rejects HTTP 200 with %s instead of reporting an OTP send", async (_name, body, contentType) => {
    const { sendVerificationOTP, OtpSendError } = await import("./auth-client");
    fetchMock.mockResolvedValue(new Response(body, { status: 200, headers: { "Content-Type": contentType } }));

    await expect(sendVerificationOTP("user@example.com")).rejects.toBeInstanceOf(OtpSendError);
  });

  it.each([
    [429, { error: "Too many OTP requests", retryAfterMs: 60000 }, "Too many OTP requests"],
    [400, { message: "Email is not allowed" }, "Email is not allowed"],
    [500, { error: { message: "Email service unavailable" } }, "Email service unavailable"],
    [200, { success: false, error: "Sending is disabled" }, "Sending is disabled"]
  ])("preserves the provider error for status %s", async (status, body, message) => {
    const { sendVerificationOTP } = await import("./auth-client");
    fetchMock.mockResolvedValue(Response.json(body, { status }));

    await expect(sendVerificationOTP("user@example.com")).rejects.toMatchObject({ name: "OtpSendError", message });
  });

  it("rejects an HTTP failure without JSON", async () => {
    const { sendVerificationOTP } = await import("./auth-client");
    fetchMock.mockResolvedValue(new Response("Bad gateway", { status: 502 }));

    await expect(sendVerificationOTP("user@example.com")).rejects.toMatchObject({
      name: "OtpSendError",
      message: "Send failed: 502"
    });
  });

  it("reports network failure without claiming a send", async () => {
    const { sendVerificationOTP, NetworkError } = await import("./auth-client");
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(sendVerificationOTP("user@example.com")).rejects.toBeInstanceOf(NetworkError);
  });
});
