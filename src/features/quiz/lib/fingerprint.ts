import FingerprintJS from "@fingerprintjs/fingerprintjs";

let cachedVisitorId: Promise<string> | null = null;

export function getFingerprint(): Promise<string> {
  if (!cachedVisitorId) {
    cachedVisitorId = FingerprintJS.load()
      .then((agent) => agent.get())
      .then((result) => result.visitorId);
  }
  return cachedVisitorId;
}
