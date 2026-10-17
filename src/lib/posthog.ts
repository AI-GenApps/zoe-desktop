import posthog, { type Properties } from "posthog-js";
import { APP_VERSION } from "@/lib/app-version";

const POSTHOG_API_KEY = import.meta.env.VITE_POSTHOG_API_KEY?.trim();
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST?.trim() || "https://us.i.posthog.com";

let isConfigured = false;
let isInitialized = false;

export function initPostHog(): void {
  if (isInitialized) return;
  isInitialized = true;

  if (!POSTHOG_API_KEY) {
    console.info("[posthog] disabled: VITE_POSTHOG_API_KEY is not configured");
    return;
  }

  try {
    posthog.init(POSTHOG_API_KEY, {
      api_host: POSTHOG_HOST,
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      persistence: "localStorage",
      loaded: (instance) => {
        instance.startExceptionAutocapture();
      }
    });
    isConfigured = true;
    captureEvent("desktop_app_started");
  } catch (error) {
    console.warn("[posthog] initialization failed; continuing without telemetry", error);
  }
}

export function captureEvent(event: string, properties?: Properties): void {
  if (!isConfigured) return;

  try {
    posthog.capture(event, {
      app_version: APP_VERSION,
      ...properties
    });
  } catch (error) {
    console.warn("[posthog] event capture failed", error);
  }
}

export function captureException(error: unknown, properties?: Properties): void {
  if (!isConfigured) return;

  try {
    posthog.captureException(error, {
      app_version: APP_VERSION,
      ...properties
    });
  } catch (captureError) {
    console.warn("[posthog] exception capture failed", captureError);
  }
}
