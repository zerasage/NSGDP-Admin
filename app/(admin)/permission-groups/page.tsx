"use client";

import { ShieldCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PermissionMatrix } from "@/components/admin/permission-matrix";
import { PermissionGroupsPanel } from "@/components/admin/permission-groups-panel";

export default function PermissionGroupsPage() {
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
