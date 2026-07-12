import { type Address, isAddress } from "viem";

export const MAX_MOOD_LENGTH = 32;
export const MAX_COLOR_LENGTH = 24;
export const MAX_NOTE_LENGTH = 120;
export const COLORS = [
  { name: "Coral", hex: "#ff5c7a" },
  { name: "Lemon", hex: "#ffd84d" },
  { name: "Mint", hex: "#59f2a6" },
  { name: "Sky", hex: "#5db7ff" },
  { name: "Lilac", hex: "#b18cff" },
  { name: "Ink", hex: "#17151f" },
] as const;
export const SHAPES = ["Square", "Circle", "Stripe", "Dot"] as const;

export const moodMosaicAbi = [
  {
    type: "event",
    name: "TileStamped",
    inputs: [
      { name: "tileId", type: "uint256", indexed: true },
      { name: "maker", type: "address", indexed: true },
      { name: "mood", type: "string", indexed: false },
      { name: "colorName", type: "string", indexed: false },
    ],
  },
  {
    type: "function",
    name: "stampTile",
    stateMutability: "nonpayable",
    inputs: [
      { name: "mood", type: "string" },
      { name: "colorName", type: "string" },
      { name: "note", type: "string" },
      { name: "shape", type: "string" },
    ],
    outputs: [{ name: "tileId", type: "uint256" }],
  },
  {
    type: "function",
    name: "getTile",
    stateMutability: "view",
    inputs: [{ name: "tileId", type: "uint256" }],
    outputs: [
      { name: "maker", type: "address" },
      { name: "mood", type: "string" },
      { name: "colorName", type: "string" },
      { name: "note", type: "string" },
      { name: "shape", type: "string" },
      { name: "createdAt", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "nextTileId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

const configuredMoodMosaicContractAddress =
  process.env.NEXT_PUBLIC_MOOD_MOSAIC_CONTRACT_ADDRESS?.trim();

export const moodMosaicContractAddress =
  configuredMoodMosaicContractAddress &&
  !configuredMoodMosaicContractAddress.includes("replace_with") &&
  isAddress(configuredMoodMosaicContractAddress)
    ? (configuredMoodMosaicContractAddress as Address)
    : undefined;
