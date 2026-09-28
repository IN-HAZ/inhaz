import type { MockUploadResult } from "./types";

/**
 * Fake profile-photo upload. Phase B: real `POST /me/photo` (backend ticket).
 * Mirrors the future response shape so the W7 onboarding can ship against it.
 */
export async function mockUploadProfilePhoto(file: {
  uri: string;
  name: string;
}): Promise<MockUploadResult> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return { url: `mock://profile-photos/${encodeURIComponent(file.name)}` };
}