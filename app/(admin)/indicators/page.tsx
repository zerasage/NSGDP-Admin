"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Indicators live under Ingestion Ops now. */
export default function IndicatorsPageRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/ingestion-ops?tab=indicators");
  }, [router]);
  return null;
}
