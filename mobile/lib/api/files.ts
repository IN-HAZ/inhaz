/**
 * Local-file upload helpers (W6).
 *
 * The `fetch` calls for converting a local image/document URI into a Blob
 * belong here, not in screens. Screens only exchange plain objects with these
 * helpers, so `app/` stays free of raw HTTP calls.
 */

/** Convert a local file URI (`file://`, `content://`, `data:`, `blob:`) into a Blob. */
export async function fileUriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`Impossible de lire le fichier (HTTP ${response.status}).`);
  }
  return response.blob();
}

/**
 * PUT a blob to an S3-style presigned URL (used for package-photo uploads).
 * The URL is provided by the backend (`/requests/{id}/photos/presigned-urls`)
 * and is out of band from axios, so we PUT directly.
 */
export async function putToSignedUrl(
  url: string,
  body: Blob,
  contentType: string
): Promise<void> {
  const response = await fetch(url, {
    method: "PUT",
    body,
    headers: { "Content-Type": contentType },
  });
  if (!response.ok) {
    throw new Error(`Échec de l\u2019upload (HTTP ${response.status}).`);
  }
}