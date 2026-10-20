/** Returns an error message if the file is not a real PDF, otherwise null. */
export async function validatePdf(file: File): Promise<string | null> {
  const looksLikePdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!looksLikePdf) return "Only PDF files are supported.";
  const header = new TextDecoder().decode(
    await file.slice(0, 5).arrayBuffer(),
  );
  if (header !== "%PDF-") return "That file doesn't look like a valid PDF.";
  return null;
}
