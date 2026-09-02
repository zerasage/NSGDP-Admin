export type DocumentPreviewKind = "pdf" | "image" | "text" | "unsupported";

function extOf(fileName: string | null | undefined): string {
  if (!fileName) return "";
  const i = fileName.lastIndexOf(".");
  return i >= 0 ? fileName.slice(i + 1).toLowerCase() : "";
}

/** Mirrors backend document-preview.utils for consistent UI behaviour. */
export function getDocumentPreviewKind(
  fileName: string | null | undefined,
  mimeType: string | null | undefined,
): DocumentPreviewKind {
  const ext = extOf(fileName);
  const mime = mimeType?.toLowerCase() ?? "";

  if (mime === "application/pdf" || ext === "pdf") return "pdf";

  if (
    mime.startsWith("image/") ||
    ["png", "jpg", "jpeg", "gif", "webp", "svg", "tif", "tiff"].includes(ext)
  ) {
    return "image";
  }

  if (
    mime === "application/json" ||
    mime === "application/geo+json" ||
    mime === "application/ld+json" ||
    mime.startsWith("text/") ||
    mime === "application/xml" ||
    mime === "text/xml" ||
    mime === "application/vnd.google-earth.kml+xml" ||
    mime === "application/rtf" ||
    mime === "text/rtf" ||
    ["json", "geojson", "txt", "md", "markdown", "rtf", "xml", "kml"].includes(ext)
  ) {
    return "text";
  }

  return "unsupported";
}

export function isJsonLikePreview(
  fileName: string | null | undefined,
  mimeType: string | null | undefined,
): boolean {
  const ext = extOf(fileName);
  const mime = mimeType?.toLowerCase() ?? "";
  return (
    mime === "application/json" ||
    mime === "application/geo+json" ||
    mime === "application/ld+json" ||
    ext === "json" ||
    ext === "geojson"
  );
}

export const DOCUMENT_PREVIEW_SUPPORTED_LABEL =
  "PDF, images (PNG, JPG, GIF, WEBP, SVG, TIFF), and text-based files (JSON, GeoJSON, TXT, Markdown, RTF, XML, KML).";

export const DOCUMENT_PREVIEW_UNSUPPORTED_LABEL =
  "Word, PowerPoint, GeoPackage, KMZ, and ZIP bundles must be downloaded to open.";
