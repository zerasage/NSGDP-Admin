"use client";

import { useState } from "react";
import { Lock, Users, Grid3X3, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PermissionMatrix } from "@/components/admin/permission-matrix";
import { PermissionGroupsPanel } from "@/components/admin/permission-groups-panel";
import { EmptyState } from "@/components/feedback/empty-state";
import { useAuth } from "@/lib/auth";

export default function PermissionGroupsPage() {
  const { user } = useAuth();

  // Group CRUD/membership/grants are super_admin-exclusive at the backend
  // (class-level @Roles('super_admin') on the whole controller) — letting a
  // self-service group escalate its own or others' permissions would be a
  // privilege-escalation path, so there is deliberately no delegated path here.
  if (user?.role !== "super_admin") {
    return (
      <EmptyState
        icon={Lock}
        title="Access restricted"
        description="Permission groups can only be managed by super_admin — this is deliberately never delegatable, to avoid a privilege-escalation path."
      />
    );
  }

  return <PermissionWorkspace />;
}

function PermissionWorkspace() {
  const [activeTab, setActiveTab] = useState("groups");
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Permission Groups</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage groups of users, their membership, and the delegated permissions granted to them.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full gap-0 overflow-hidden rounded-2xl border bg-card">
        <div className="border-b p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold">Access-control workspace</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Configure staff groups or compare effective delegated access.</p>
            </div>
            {activeTab === "groups" && <Button className="h-11 w-full sm:w-auto" onClick={() => setCreateOpen(true)}><Plus className="size-4" />New Group</Button>}
          </div>
          <div className="mt-3 scrollbar-hide overflow-x-auto rounded-xl bg-muted/60 p-1">
            <TabsList className="h-11 min-w-max justify-start gap-1 bg-transparent p-0">
              <TabsTrigger value="groups" className="h-11 min-w-40 gap-2 px-4 data-active:bg-primary data-active:text-primary-foreground data-active:shadow-none"><Users className="size-4" />Groups</TabsTrigger>
              <TabsTrigger value="matrix" className="h-11 min-w-48 gap-2 px-4 data-active:bg-primary data-active:text-primary-foreground data-active:shadow-none"><Grid3X3 className="size-4" />Permission matrix</TabsTrigger>
            </TabsList>
          </div>
        </div>
        <TabsContent value="groups" className="bg-background p-4 sm:p-5">
          <PermissionGroupsPanel createOpen={createOpen} onCreateOpenChange={setCreateOpen} />
        </TabsContent>
        <TabsContent value="matrix" className="bg-background p-4 sm:p-5">
          <PermissionMatrix />
        </TabsContent>
      </Tabs>
    </div>
  );
}
