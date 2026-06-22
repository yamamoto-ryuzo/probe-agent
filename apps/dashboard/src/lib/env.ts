declare global {
  interface Window {
    __ENV__?: {
      PROBE_CLIENT_SERVER_URL?: string;
    };
  }
}

export function getClientServerUrl(): string {
  const fromEnv = window.__ENV__?.PROBE_CLIENT_SERVER_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  return window.location.origin.replace(/:8501\b/, ":8000");
}
