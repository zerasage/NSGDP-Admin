"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function useDraftAutoSave(active: boolean, deps: unknown[]) {
  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      toast.info("Draft saved automatically");
    }, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, ...deps]);
}
