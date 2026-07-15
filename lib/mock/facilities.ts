import type { Facility, FacilityType } from "@/types";
import { NIGER_STATE_LGAS } from "@/lib/constants/core";

const WARDS: Record<string, string[]> = {
  Chanchaga: ["Tudun Wada", "Limawa", "Maitumbi", "Kpakungu"],
  Bida: ["Lemu", "Gbazango", "Baddegi", "Katcha Road"],
  Suleja: ["Iku", "Hussaini", "Bagagwa", "Kwamba"],
  Minna: ["Bosso", "Kwangila", "Dutsen Kura", "Tunga"],
  Kontagora: ["Central", "Masuga", "Tungan Gaya", "Gabas"],
};

const TYPES: FacilityType[] = ["PHC", "Secondary", "General Hospital"];

function wardFor(lga: string, i: number): string {
  const wards = WARDS[lga] ?? ["Ward A", "Ward B", "Ward C", "Ward D"];
  return wards[i % wards.length];
}

// Niger State approximate centre + per-LGA offsets
const LGA_COORDS: Record<string, { lat: number; lng: number }> = {
  Chanchaga: { lat: 9.6, lng: 6.55 },
  Bida: { lat: 9.08, lng: 6.02 },
  Suleja: { lat: 9.18, lng: 7.18 },
  Minna: { lat: 9.58, lng: 6.52 },
  Kontagora: { lat: 10.4, lng: 5.6 },
  Bosso: { lat: 9.62, lng: 6.58 },
  Lapai: { lat: 9.04, lng: 6.57 },
  Mokwa: { lat: 9.28, lng: 5.05 },
  Rafi: { lat: 10.2, lng: 6.1 },
  Shiroro: { lat: 10.1, lng: 6.8 },
};

function coordFor(lga: string, i: number): { lat: number; lng: number } {
  const base = LGA_COORDS[lga] ?? { lat: 9.5 + (i % 3) * 0.1, lng: 6.2 + (i % 4) * 0.15 };
  return {
    lat: base.lat + (i % 5) * 0.02 - 0.04,
    lng: base.lng + (i % 7) * 0.02 - 0.06,
  };
}

const facilities: Facility[] = [];
let fid = 1;

for (const lga of NIGER_STATE_LGAS) {
  const count = lga === "Chanchaga" || lga === "Bida" ? 4 : 2;
  for (let i = 0; i < count; i++) {
    const type = i === 0 && (lga === "Chanchaga" || lga === "Bida") ? "General Hospital" : TYPES[i % TYPES.length];
    const name =
      type === "General Hospital"
        ? `${lga} General Hospital`
        : type === "Secondary"
          ? `${lga} Secondary Health Centre`
          : `${lga} PHC ${i + 1}`;
    facilities.push({
      id: `fac-${fid}`,
      name,
      lga,
      ward: wardFor(lga, i),
      facilityType: type,
      facilityCode: `NS-${lga.slice(0, 3).toUpperCase()}-${String(fid).padStart(4, "0")}`,
      coordinates: coordFor(lga, i),
    });
    fid++;
  }
}

export const mockFacilities: Facility[] = facilities;

export function getFacilities(filters?: {
  lga?: string;
  ward?: string;
  facilityType?: FacilityType | "all";
  query?: string;
}) {
  let results = [...mockFacilities];
  if (filters?.lga) results = results.filter((f) => f.lga === filters.lga);
  if (filters?.ward) results = results.filter((f) => f.ward === filters.ward);
  if (filters?.facilityType && filters.facilityType !== "all") {
    results = results.filter((f) => f.facilityType === filters.facilityType);
  }
  if (filters?.query) {
    const q = filters.query.toLowerCase();
    results = results.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.facilityCode.toLowerCase().includes(q) ||
        f.lga.toLowerCase().includes(q)
    );
  }
  return results;
}

export function getWardsForLGA(lga: string): string[] {
  const wards = new Set(
    mockFacilities.filter((f) => f.lga === lga).map((f) => f.ward)
  );
  return Array.from(wards).sort();
}
