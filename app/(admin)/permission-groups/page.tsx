"use client";

import { ShieldCheck, Lock } from "lucide-react";
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="size-5" />
          Permission Groups
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage groups of users, their membership, and the delegated permissions granted to them.
        </p>
      </div>

      <Tabs defaultValue="groups" className="w-full">
        <TabsList>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="matrix">Permission Matrix</TabsTrigger>
        </TabsList>
        <TabsContent value="groups" className="mt-6">
          <PermissionGroupsPanel />
        </TabsContent>
        <TabsContent value="matrix" className="mt-6">
          <PermissionMatrix />
        </TabsContent>
      </Tabs>
    </div>
  );
}
