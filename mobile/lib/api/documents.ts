import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { apiClient, API_URL, getAuthToken } from "./client";
import { fileUriToBlob } from "./files";

export interface DriverDocument {
  id: number;
  type: string;
  status: string;
  expires_at: string | null;
}

export interface DocumentViewResult {
  /** A renderable uri: blob URL (web) or cached file path (native). */
  uri: string;
  kind: "image" | "pdf";
}

/** Local file to upload (picker asset or image uri). */
export interface DocumentFileInput {
  uri: string;
  name: string;
  mimeType?: string;
}

/**
 * Driver documents API (W6 §6.2). Owns list/upload/view so the documents
 * screens contain no HTTP. The `view` path also encapsulates the platform
 * download (web → blob URL, native → FileSystem cache).
 */
export const documentsApi = {
  list: async (): Promise<DriverDocument[]> => {
    const response = await apiClient.get<{ documents: DriverDocument[] }>(
      "/driver/documents"
    );
    return response.data.documents;
  },

  upload: async (type: string, file: DocumentFileInput): Promise<DriverDocument> => {
    const formData = new FormData();
    formData.append("type", type);

    if (file.uri.startsWith("data:") || file.uri.startsWith("blob:")) {
      const blob = await fileUriToBlob(file.uri);
      formData.append("file", blob, file.name);
    } else {
      formData.append("file", {
        uri: file.uri,
        name: file.name,
        type: file.mimeType,
      } as unknown as Blob);
    }

    const response = await apiClient.post<{
      message: string;
      document: DriverDocument;
    }>("/driver/documents", formData, {
      headers: { "Content-Type": undefined },
    });
    return response.data.document;
  },

  /**
   * Fetch + renderable form for a document. Throws on expired/absent session
   * or on a non-2xx download so the viewer screen only renders the result.
   */
  getView: async (id: number): Promise<DocumentViewResult> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Session expirée, reconnectez-vous.");
    }
    const url = `${API_URL}/driver/documents/${id}/view`;
    const headers = { Authorization: `Bearer ${token}` };

    if (Platform.OS === "web") {
      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const contentType = response.headers.get("content-type") || "";
      return {
        uri: URL.createObjectURL(await response.blob()),
        kind: contentType.startsWith("image/") ? "image" : "pdf",
      };
    }

    // Native: download into the cache dir, rename by detected mime.
    const dir = `${FileSystem.cacheDirectory}inhaz-docs/`;
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

    const probe = `${dir}doc-${id}.tmp`;
    await FileSystem.deleteAsync(probe, { idempotent: true });

    const result = await FileSystem.downloadAsync(url, probe, { headers });
    if (result.status < 200 || result.status >= 300) {
      throw new Error(`HTTP ${result.status}`);
    }

    const mime = result.mimeType || result.headers?.["Content-Type"] || "";
    const ext = mime.includes("png")
      ? ".png"
      : mime.includes("jpeg") || mime.includes("jpg")
        ? ".jpg"
        : mime.includes("gif")
          ? ".gif"
          : ".pdf";
    const target = `${dir}doc-${id}${ext}`;
    await FileSystem.deleteAsync(target, { idempotent: true });
    await FileSystem.moveAsync({ from: probe, to: target });

    return { uri: target, kind: ext === ".pdf" ? "pdf" : "image" };
  },
};