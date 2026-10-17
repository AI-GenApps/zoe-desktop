import { loadSessionToken } from "@/lib/secure-storage";

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

export class OtpSendError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OtpSendError";
  }
}

export class OtpExpiredError extends Error {
  constructor() {
    super("Code expired — resend?");
    this.name = "OtpExpiredError";
  }
}

export class OtpInvalidError extends Error {
  constructor() {
    super("Incorrect code. Try again.");
    this.name = "OtpInvalidError";
  }
}

export class NetworkError extends Error {
  constructor() {
    super("Connection error — check your internet.");
    this.name = "NetworkError";
  }
}

export async function sendVerificationOTP(email: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/auth/email-otp/send-verification-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, type: "sign-in" })
    });
  } catch {
    throw new NetworkError();
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new OtpSendError(body?.message ?? `Send failed: ${res.status}`);
  }
}

export interface VerifyResult {
  token: string | null;
  user?: { id?: string; email?: string };
}

export async function verifyEmailOTP(email: string, otp: string): Promise<VerifyResult> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/auth/sign-in/email-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, type: "sign-in", otp })
    });
  } catch {
    throw new NetworkError();
  }

  if (res.status === 401 || res.status === 400) {
    const body = await res.json().catch(() => ({}));
    const msg: string = body?.message ?? body?.error ?? "";
    if (/expired/i.test(msg)) throw new OtpExpiredError();
    throw new OtpInvalidError();
  }
  if (!res.ok) throw new NetworkError();

  const body = (await res.json().catch(() => ({}))) as { token?: string; user?: { id?: string; email?: string } };
  const token = body.token ?? res.headers.get("set-auth-token") ?? null;

  return { token, user: body.user };
}

export async function validateSession(): Promise<boolean> {
  try {
    const token = await loadSessionToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    const res = await fetch(`${API_BASE}/api/auth/session`, { credentials: "include", headers });
    return res.ok;
  } catch {
    return false;
  }
}

export async function registerDevice(token: string, deviceName: string): Promise<string | null> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/member/devices/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      credentials: "include",
      body: JSON.stringify({ device_name: deviceName, platform: "macos" })
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const body = await res.json().catch(() => ({}));
  return body?.device_id ?? null;
}
