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

export const HIGHLIGHT_COLORS = [
  { id: "yellow", value: "#fde047", label: "Yellow" },
  { id: "green", value: "#86efac", label: "Green" },
  { id: "pink", value: "#f9a8d4", label: "Pink" },
  { id: "blue", value: "#93c5fd", label: "Blue" },
];
