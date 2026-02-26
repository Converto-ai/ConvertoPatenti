import mammoth from "mammoth";

export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  if (result.messages.length > 0) {
    console.warn("[DOCX extractor] Warnings:", result.messages);
  }
  return result.value;
}
