import { USE_MOCK } from "./config";
import { mockUploadProfilePhoto } from "./mock";

export interface UploadResult {
  url: string;
}

export interface UploadFileInput {
  uri: string;
  name: string;
  type?: string;
}

/**
 * User-content uploads (W6 §6.5). The profile-photo path is mock-backed until
 * the backend photo endpoint ships (Phase B); the real branch is the seam for
 * that ticket.
 */
export const uploadsApi = {
  uploadProfilePhoto: async (file: UploadFileInput): Promise<UploadResult> => {
    if (USE_MOCK) {
      return mockUploadProfilePhoto(file);
    }
    // POST /me/photo — backend ticket (Phase B). Not shipped yet.
    throw new Error("Upload de photo de profil indisponible pour le moment.");
  },
};