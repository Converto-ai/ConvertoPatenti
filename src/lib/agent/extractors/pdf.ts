// pdf-parse has CommonJS module compatibility issues in ESM.
// We use a dynamic require workaround.
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse");
  const result = await pdfParse(buffer);
  return result.text as string;
}
