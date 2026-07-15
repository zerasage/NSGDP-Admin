"use client";

import { useEffect, useState } from "react";
import { ActivityGraph } from "@/components/charts/activity-graph";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getDatasetActivity } from "@/lib/mock";

export function DatasetActivityPanel() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Awaited<ReturnType<typeof getDatasetActivity>> | null>(null);

  useEffect(() => {
    getDatasetActivity().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Views & Downloads</CardTitle>
      </CardHeader>
      <CardContent>
        <ActivityGraph
          data7d={data?.activity7d ?? []}
          data30d={data?.activity30d ?? []}
        />
      </CardContent>
    </Card>
  );
}
