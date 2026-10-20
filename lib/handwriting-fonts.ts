import {
  Caveat,
  Kalam,
  Patrick_Hand,
  Indie_Flower,
  Shadows_Into_Light,
  Gloria_Hallelujah,
  Architects_Daughter,
  Handlee,
  Dancing_Script,
  Nanum_Pen_Script,
  Reenie_Beanie,
  Permanent_Marker,
  Homemade_Apple,
  Covered_By_Your_Grace,
} from "next/font/google";

// preload is off: fonts load on demand (when a note is drawn or the picker is opened).
// next/font needs every option written out as a literal in each call.
const caveat = Caveat({ subsets: ["latin"], display: "swap", preload: false });
const kalam = Kalam({ subsets: ["latin"], weight: "400", display: "swap", preload: false });
const patrick = Patrick_Hand({ subsets: ["latin"], weight: "400", display: "swap", preload: false });
const indie = Indie_Flower({ subsets: ["latin"], weight: "400", display: "swap", preload: false });
const shadows = Shadows_Into_Light({ subsets: ["latin"], weight: "400", display: "swap", preload: false });
const gloria = Gloria_Hallelujah({ subsets: ["latin"], weight: "400", display: "swap", preload: false });
const architects = Architects_Daughter({ subsets: ["latin"], weight: "400", display: "swap", preload: false });
const handlee = Handlee({ subsets: ["latin"], weight: "400", display: "swap", preload: false });
const dancing = Dancing_Script({ subsets: ["latin"], display: "swap", preload: false });
const nanum = Nanum_Pen_Script({ subsets: ["latin"], weight: "400", display: "swap", preload: false });
const reenie = Reenie_Beanie({ subsets: ["latin"], weight: "400", display: "swap", preload: false });
const marker = Permanent_Marker({ subsets: ["latin"], weight: "400", display: "swap", preload: false });
const homemade = Homemade_Apple({ subsets: ["latin"], weight: "400", display: "swap", preload: false });
const covered = Covered_By_Your_Grace({ subsets: ["latin"], weight: "400", display: "swap", preload: false });

export type FontId = string;

export interface HandwritingFont {
  id: FontId;
  label: string;
  family: string;
  /** Font size (px) used on a 40px ruled row; some faces run small or large. */
  size: number;
}

export const HANDWRITING_FONTS: HandwritingFont[] = [
  { id: "caveat", label: "Caveat", family: caveat.style.fontFamily, size: 32 },
  { id: "kalam", label: "Kalam", family: kalam.style.fontFamily, size: 28 },
  { id: "patrick", label: "Patrick Hand", family: patrick.style.fontFamily, size: 30 },
  { id: "indie", label: "Indie Flower", family: indie.style.fontFamily, size: 28 },
  { id: "shadows", label: "Shadows Into Light", family: shadows.style.fontFamily, size: 32 },
  { id: "gloria", label: "Gloria Hallelujah", family: gloria.style.fontFamily, size: 24 },
  { id: "architects", label: "Architects Daughter", family: architects.style.fontFamily, size: 26 },
  { id: "handlee", label: "Handlee", family: handlee.style.fontFamily, size: 28 },
  { id: "dancing", label: "Dancing Script", family: dancing.style.fontFamily, size: 30 },
  { id: "nanum", label: "Nanum Pen", family: nanum.style.fontFamily, size: 38 },
  { id: "reenie", label: "Reenie Beanie", family: reenie.style.fontFamily, size: 38 },
  { id: "marker", label: "Permanent Marker", family: marker.style.fontFamily, size: 24 },
  { id: "homemade", label: "Homemade Apple", family: homemade.style.fontFamily, size: 22 },
  { id: "covered", label: "Covered By Your Grace", family: covered.style.fontFamily, size: 32 },
];

export function getFont(id: string): HandwritingFont {
  return HANDWRITING_FONTS.find((f) => f.id === id) ?? HANDWRITING_FONTS[0];
}

/** Used both as the note's ink color and as the marker color over the PDF text. */
export const HIGHLIGHT_COLORS = [
  { id: "black", value: "#111827", label: "Black" },
  { id: "blue", value: "#2563eb", label: "Blue" },
  { id: "red", value: "#dc2626", label: "Red" },
  { id: "green", value: "#16a34a", label: "Green" },
  { id: "purple", value: "#9333ea", label: "Purple" },
  { id: "orange", value: "#ea580c", label: "Orange" },
  { id: "white", value: "#ffffff", label: "White" },
];

/** White text and highlights would vanish on white paper, so they get a visible stand-in. */
export const isWhite = (color: string) => color.toLowerCase() === "#ffffff";
