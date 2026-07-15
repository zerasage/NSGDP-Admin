import type { FileFormat } from "@/types";

// The 25 Local Government Areas of Niger State (PRD: LGA Coverage filter).
export const NIGER_STATE_LGAS = [
  "Agaie",
  "Agwara",
  "Bida",
  "Borgu",
  "Bosso",
  "Chanchaga",
  "Edati",
  "Gbako",
  "Gurara",
  "Katcha",
  "Kontagora",
  "Lapai",
  "Lavun",
  "Magama",
  "Mariga",
  "Mashegu",
  "Mokwa",
  "Munya",
  "Paikoro",
  "Rafi",
  "Rijau",
  "Shiroro",
  "Suleja",
  "Tafa",
  "Wushishi",
] as const;

export const FILE_FORMATS: FileFormat[] = [
  "CSV",
  "XLSX",
  "PDF",
  "JSON",
  "GeoJSON",
  "Shapefile",
  "KML",
  "Other",
];

// Sectors used for organisation filtering (PUB-04).
export const SECTORS = [
  "Health",
  "Agriculture",
  "Education",
  "Finance",
  "Infrastructure",
  "Environment",
  "Other",
] as const;
