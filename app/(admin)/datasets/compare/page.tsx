"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Dataset compare lives under Ingestion Ops now. */
export default function DatasetComparePageRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/ingestion-ops?tab=compare");
  }, [router]);
  return null;
}
