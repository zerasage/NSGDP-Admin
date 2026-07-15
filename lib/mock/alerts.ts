import type { OutbreakAlert } from "@/types";

export const mockAlerts: OutbreakAlert[] = [
  {
    id: "alert-1",
    title: "Meningitis (CSM) Alert — Bosso & Paikoro LGAs",
    summary: "Cerebrospinal meningitis cases have exceeded the epidemic threshold in Bosso and Paikoro LGAs. Enhanced surveillance and reactive vaccination are underway.",
    disease: "Meningitis (CSM)",
    affectedLGAs: ["Bosso", "Paikoro"],
    severity: "critical",
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    active: true,
  },
  {
    id: "alert-2",
    title: "Cholera Watch — Bida LGA",
    summary: "Isolated Acute Watery Diarrhoea cases under investigation in Bida. Community sensitisation is ongoing. No confirmed cholera Vibrio O1 yet.",
    disease: "Cholera (AWD)",
    affectedLGAs: ["Bida"],
    severity: "warning",
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    active: true,
  },
];
