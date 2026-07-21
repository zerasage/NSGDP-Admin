"use client";

import { ShieldCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PermissionMatrix } from "@/components/admin/permission-matrix";
import { PermissionDelegationPanel } from "@/components/admin/permission-delegation-panel";

export default function PermissionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="size-5" />
          Permissions
        </h1>
        <p className="text-muted-foreground mt-1">
          Review the base permissions granted by role, and delegate additional atomic permissions
          to user groups.
        </p>
      </div>

      <Tabs defaultValue="delegation" className="w-full">
        <TabsList>
          <TabsTrigger value="delegation">Group Delegation</TabsTrigger>
          <TabsTrigger value="matrix">Permission Matrix</TabsTrigger>
        </TabsList>
        <TabsContent value="delegation" className="mt-6">
          <PermissionDelegationPanel />
        </TabsContent>
        <TabsContent value="matrix" className="mt-6">
          <PermissionMatrix />
        </TabsContent>
      </Tabs>
    </div>
  );
}
