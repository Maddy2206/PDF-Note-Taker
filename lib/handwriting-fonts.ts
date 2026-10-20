import { Caveat, Kalam, Patrick_Hand, Indie_Flower } from "next/font/google";

const caveat = Caveat({ subsets: ["latin"], display: "swap" });
const kalam = Kalam({ subsets: ["latin"], weight: "400", display: "swap" });
const patrick = Patrick_Hand({ subsets: ["latin"], weight: "400", display: "swap" });
const indie = Indie_Flower({ subsets: ["latin"], weight: "400", display: "swap" });

export type FontId = "caveat" | "kalam" | "patrick" | "indie";

export interface HandwritingFont {
  id: FontId;
  label: string;
  family: string;
}

export const HANDWRITING_FONTS: HandwritingFont[] = [
  { id: "caveat", label: "Caveat", family: caveat.style.fontFamily },
  { id: "kalam", label: "Kalam", family: kalam.style.fontFamily },
  { id: "patrick", label: "Patrick Hand", family: patrick.style.fontFamily },
  { id: "indie", label: "Indie Flower", family: indie.style.fontFamily },
];

export function getFont(id: string): HandwritingFont {
  return HANDWRITING_FONTS.find((f) => f.id === id) ?? HANDWRITING_FONTS[0];
}

/** Used both as the note's ink color and as the marker color over the PDF text. */
export const HIGHLIGHT_COLORS = [
  { id: "blue", value: "#2563eb", label: "Blue" },
  { id: "red", value: "#dc2626", label: "Red" },
  { id: "green", value: "#16a34a", label: "Green" },
  { id: "purple", value: "#9333ea", label: "Purple" },
  { id: "orange", value: "#ea580c", label: "Orange" },
];
