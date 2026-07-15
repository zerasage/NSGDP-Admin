"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useOrganisations } from "@/lib/hooks/useOrganisations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableRowSkeleton } from "@/components/feedback/skeletons";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { statusPill } from "@/lib/constants/status-surfaces";
import { CreateOrganisationModal } from "@/components/admin/create-organisation-modal";

const TYPE_STYLES = {
  government: statusPill.emerald,
  ngo: statusPill.amber,
  private: statusPill.blue,
  international: statusPill.purple,
  academic: statusPill.blue,
  community: statusPill.emerald,
};

export default function AdminOrganisationsPage() {
  const { data, isLoading } = useOrganisations(1, 100);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const orgs = useMemo(() => {
    return data?.data || [];
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Organisation Management</h1>
          <p className="text-muted-foreground mt-1">
            {orgs.length} organisations · manage partner organisations
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="size-4" />
          Add New Org
        </Button>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Website</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? [...Array(5)].map((_, i) => <TableRowSkeleton key={i} cols={6} />)
              : orgs.map((o) => {
                  const typeStyle = TYPE_STYLES[o.type as keyof typeof TYPE_STYLES] || statusPill.blue;
                  return (
                    <tr key={o.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{o.name}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className={cn("border-0 capitalize text-xs", typeStyle)}>
                          {o.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {o.website ? (
                          <a href={o.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {new URL(o.website).hostname}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{o.email ?? "—"}</td>
                      <td className="px-4 py-3">
                        <Badge variant={o.isActive ? "default" : "secondary"} className="text-xs">
                          {o.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="outline" onClick={() => toast.info(`View details for ${o.name}`)}>
                          View Details
                        </Button>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      <CreateOrganisationModal 
        open={createModalOpen} 
        onClose={() => setCreateModalOpen(false)} 
      />
    </div>
  );
}
