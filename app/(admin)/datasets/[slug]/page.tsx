"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Download, History, MapPin, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiClient } from "@/lib/api/client";
import { useDatasetVersions } from "@/lib/hooks/useDatasets";

interface Dataset {
  id: string;
  title: string;
  slug: string;
  description: string;
  format: string;
  visibility: string;
  status: string;
  tags: string[];
  geographic_coverage: string[];
  license: string;
  owner_id: string;
  organisation_id: string;
  created_at: string;
  updated_at: string;
  download_count: number;
}

export default function DatasetDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();

  // Fetch dataset details (using admin endpoint to see all statuses)
  const { data: dataset, isLoading, error } = useQuery({
    queryKey: ['dataset', slug],
    queryFn: async () => {
      const response = await apiClient.get<{ data: Dataset }>(`/admin/datasets/${slug}`);
      return response.data.data;
    },
  });

  const { data: versionHistory } = useDatasetVersions(slug);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !dataset) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <Alert variant="destructive">
          <AlertDescription>
            Dataset not found or you don&apos;t have permission to view it.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800 border-gray-300",
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    under_review: "bg-blue-100 text-blue-800 border-blue-300",
    approved: "bg-green-100 text-green-800 border-green-300",
    rejected: "bg-red-100 text-red-800 border-red-300",
    archived: "bg-gray-100 text-gray-600 border-gray-300",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-3 -ml-3"
            onClick={() => router.back()}
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">{dataset.title}</h1>
          <p className="text-muted-foreground mt-1">Dataset Details</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={statusColors[dataset.status] || "bg-gray-100 text-gray-800"}>
            {dataset.status.replace('_', ' ').toUpperCase()}
          </Badge>
          {(dataset.status === 'pending' || dataset.status === 'under_review') && (
            <Button size="sm" onClick={() => router.push(`/datasets/${slug}/review`)}>
              Review
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Main Info */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{dataset.description}</p>
            </CardContent>
          </Card>

          {dataset.tags && dataset.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="size-4" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {dataset.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {dataset.geographic_coverage && dataset.geographic_coverage.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="size-4" />
                  Geographic Coverage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {dataset.geographic_coverage.map((location, index) => (
                    <Badge key={index} variant="outline">
                      {location}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Metadata */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dataset Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Format</p>
                <Badge variant="secondary" className="uppercase">
                  {dataset.format}
                </Badge>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Visibility</p>
                <Badge variant="outline" className="capitalize">
                  {dataset.visibility}
                </Badge>
              </div>

              {dataset.license && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">License</p>
                  <p className="text-sm">{dataset.license}</p>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                <Download className="size-4" />
                <span>{dataset.download_count || 0} downloads</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="size-4" />
                <span>
                  Created {new Date(dataset.created_at).toLocaleDateString()}
                </span>
              </div>

              {dataset.updated_at && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="size-4" />
                  <span>
                    Updated {new Date(dataset.updated_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {versionHistory && versionHistory.versions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="size-4" />
                  Version History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {versionHistory.versions.map((v) => (
                    <li key={v.id} className="text-sm border-l-2 border-muted pl-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">v{v.version}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(v.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-0.5">{v.changes}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {dataset.status === 'draft' && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-6">
                <p className="text-sm text-amber-800">
                  <strong>Draft Status:</strong> This dataset is not yet published and is only visible to administrators.
                </p>
              </CardContent>
            </Card>
          )}

          {dataset.status === 'pending' && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <p className="text-sm text-blue-800">
                  <strong>Pending Review:</strong> This dataset is awaiting review and approval.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
