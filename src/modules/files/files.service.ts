import { insertFile, listFilesByOwner } from "./files.repository";

export async function createFileRecord(input: {
  ownerId: string;
  kind: "image" | "video";
  bucket: string;
  path: string;
  mimeType: string | null;
  sizeBytes: number | null;
  metadata?: Record<string, unknown>;
}) {
  return insertFile(input);
}

export async function listMyFiles(ownerId: string) {
  return listFilesByOwner(ownerId);
}
