"use client";

import { useState } from "react";
import { Lock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrganisationGroupsPanel } from "@/components/admin/organisation-groups-panel";
import { EmptyState } from "@/components/feedback/empty-state";
import { useAuth } from "@/lib/auth";

export default function OrganisationGroupsPage() {
  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);

  // Organisation Groups are super_admin-exclusive. Organisation capability grants
  // should not be delegatable — unlike permission groups which gate staff actions,
  // organisation groups gate what member organisations can create, which is a
  // structural policy decision that must remain under central control.
  if (user?.role !== "super_admin") {
    return (
      <EmptyState
        icon={Lock}
        title="Access restricted"
        description="Organisation groups can only be managed by super_admin. This ensures capability grants remain under central policy control."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Organisation Groups</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage groups of organisations, their membership, and the capabilities granted to them.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="border-b p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold">Organisation capability workspace</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Configure which organisations can create programmes and other high-level actions.
              </p>
            </div>
            <Button className="h-11 w-full sm:w-auto" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              New Group
            </Button>
          </div>
        </div>
        <div className="bg-background p-4 sm:p-5">
          <OrganisationGroupsPanel createOpen={createOpen} onCreateOpenChange={setCreateOpen} />
        </div>
      </div>
    </div>
  );
}
