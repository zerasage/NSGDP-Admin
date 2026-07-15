"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/auth";
import {
  canEditProgram,
  canProgram,
  getEffectiveProgramPermissions,
} from "@/lib/auth/program-permissions";
import type { ProgramCapability } from "@/lib/auth/program-permissions";

export function useProgramPermissions() {
  const { user } = useAuth();
  const role = user?.role ?? "public";
  const userId = user?.id ?? "";
  const organisationId = user?.organisationId;

  return useMemo(
    () => ({
      permissions: getEffectiveProgramPermissions(role, userId),
      can: (capability: ProgramCapability) =>
        canProgram(role, userId, capability),
      canEdit: (programOrganisationId?: string) =>
        canEditProgram(
          role,
          userId,
          organisationId ? [organisationId] : [],
          programOrganisationId
        ),
      canCreate: canProgram(role, userId, "create"),
      canUpload: canProgram(role, userId, "upload"),
      canDelete: canProgram(role, userId, "delete"),
    }),
    [role, userId, organisationId]
  );
}
