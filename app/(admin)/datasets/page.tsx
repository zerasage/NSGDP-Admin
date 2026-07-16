'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/lib/hooks/use-toast';
import { adminApi } from '@/lib/api/admin';
import { Loader2 } from 'lucide-react';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Eye,
  Calendar,
  Building2,
  Database,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface Dataset {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: string;
  format: string;
  visibility: string;
  owner_id: string;
  organisation_id: string | null;
  submitted_at: string;
  created_at: string;
  review_comment?: string;
}

interface Organisation {
  id: string;
  name: string;
  slug: string;
}

export default function DatasetsReviewPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'pending' | 'under-review' | 'approved' | 'rejected' | 'all'>('pending');
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [comment, setComment] = useState('');
  const [reason, setReason] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState<string>('all');

  // Fetch organizations for filter
  const { data: organisationsData } = useQuery({
    queryKey: ['admin', 'organisations'],
    queryFn: async () => {
      const response = await adminApi.get('/admin/organisations?page=1&limit=100');
      return response.data.data as { data: Organisation[]; meta: any };
    },
  });

  // Build query params based on org filter
  const buildQueryParams = (status?: string) => {
    const params = new URLSearchParams();
    params.append('page', '1');
    params.append('limit', status ? '50' : '100');
    if (status) params.append('status', status);
    if (selectedOrgId && selectedOrgId !== 'all') {
      params.append('organisationId', selectedOrgId);
    }
    return params.toString();
  };

  // Fetch pending datasets
  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ['admin', 'datasets', 'pending', selectedOrgId],
    queryFn: async () => {
      const response = await adminApi.get(`/admin/review-queue?${buildQueryParams()}`);
      return response.data.data as { data: Dataset[]; meta: any };
    },
  });

  // Fetch under review datasets
  const { data: underReviewData, isLoading: underReviewLoading } = useQuery({
    queryKey: ['admin', 'datasets', 'under-review', selectedOrgId],
    queryFn: async () => {
      const response = await adminApi.get(`/admin/review-queue/under-review?${buildQueryParams()}`);
      return response.data.data as { data: Dataset[]; meta: any };
    },
  });

  // Fetch approved datasets
  const { data: approvedData, isLoading: approvedLoading } = useQuery({
    queryKey: ['admin', 'datasets', 'approved', selectedOrgId],
    queryFn: async () => {
      const response = await adminApi.get(`/admin/datasets?${buildQueryParams('approved')}`);
      return response.data.data as { data: Dataset[]; meta: any };
    },
  });

  // Fetch rejected datasets
  const { data: rejectedData, isLoading: rejectedLoading } = useQuery({
    queryKey: ['admin', 'datasets', 'rejected', selectedOrgId],
    queryFn: async () => {
      const response = await adminApi.get(`/admin/datasets?${buildQueryParams('rejected')}`);
      return response.data.data as { data: Dataset[]; meta: any };
    },
  });

  // Fetch all datasets
  const { data: allData, isLoading: allLoading } = useQuery({
    queryKey: ['admin', 'datasets', 'all', selectedOrgId],
    queryFn: async () => {
      const response = await adminApi.get(`/admin/datasets?${buildQueryParams()}`);
      return response.data.data as { data: Dataset[]; meta: any };
    },
  });

  // Mark as under review mutation
  const markUnderReviewMutation = useMutation({
    mutationFn: (slug: string) => adminApi.post(`/admin/datasets/${slug}/mark-under-review`, {}),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Dataset marked as under review',
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'datasets'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark dataset as under review',
        variant: 'destructive',
      });
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: ({ slug, comment }: { slug: string; comment?: string }) =>
      adminApi.post(`/admin/datasets/${slug}/approve`, { comment }),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Dataset approved successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'datasets'] });
      setReviewAction(null);
      setSelectedDataset(null);
      setComment('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve dataset',
        variant: 'destructive',
      });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ slug, reason }: { slug: string; reason: string }) =>
      adminApi.post(`/admin/datasets/${slug}/reject`, { reason }),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Dataset rejected',
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'datasets'] });
      setReviewAction(null);
      setSelectedDataset(null);
      setReason('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject dataset',
        variant: 'destructive',
      });
    },
  });

  const handleReviewClick = (dataset: Dataset, action: 'approve' | 'reject') => {
    setSelectedDataset(dataset);
    setReviewAction(action);
  };

  const handleConfirmReview = () => {
    if (!selectedDataset) return;

    if (reviewAction === 'approve') {
      approveMutation.mutate({ slug: selectedDataset.slug, comment });
    } else if (reviewAction === 'reject') {
      if (reason.length < 20) {
        toast({
          title: 'Error',
          description: 'Rejection reason must be at least 20 characters',
          variant: 'destructive',
        });
        return;
      }
      rejectMutation.mutate({ slug: selectedDataset.slug, reason });
    }
  };

  const handleMarkUnderReview = (slug: string) => {
    markUnderReviewMutation.mutate(slug);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      pending: { variant: 'secondary', icon: <Clock className="h-3 w-3 mr-1" /> },
      under_review: { variant: 'default', icon: <Eye className="h-3 w-3 mr-1" /> },
      approved: { variant: 'default', icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
      rejected: { variant: 'destructive', icon: <XCircle className="h-3 w-3 mr-1" /> },
      draft: { variant: 'outline', icon: <FileText className="h-3 w-3 mr-1" /> },
    };

    const config = variants[status] || variants.draft;

    return (
      <Badge variant={config.variant} className="flex items-center w-fit">
        {config.icon}
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const renderDatasetTable = (datasets: Dataset[], showMarkUnderReview: boolean) => {
    if (!datasets || datasets.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No datasets to review</p>
          <p className="text-sm mt-2">Check back later for new submissions</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Format</TableHead>
            <TableHead>Visibility</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {datasets.map((dataset) => {
            const org = organisationsData?.data?.find(o => o.id === dataset.organisation_id);
            return (
              <TableRow key={dataset.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <Link 
                      href={`/datasets/${dataset.slug}`}
                      className="font-medium hover:underline"
                    >
                      {dataset.title}
                    </Link>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {dataset.description}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-sm">
                    <Building2 className="h-3 w-3 mr-1 text-muted-foreground" />
                    {org ? org.name : 'Unknown'}
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(dataset.status)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{dataset.format.toUpperCase()}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{dataset.visibility}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    {dataset.submitted_at
                      ? format(new Date(dataset.submitted_at), 'MMM d, yyyy')
                      : format(new Date(dataset.created_at), 'MMM d, yyyy')}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/datasets/${dataset.slug}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    {showMarkUnderReview && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkUnderReview(dataset.slug)}
                        disabled={markUnderReviewMutation.isPending}
                      >
                        Start Review
                      </Button>
                    )}
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleReviewClick(dataset, 'approve')}
                      disabled={approveMutation.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleReviewClick(dataset, 'reject')}
                      disabled={rejectMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dataset Review Queue</h1>
          <p className="text-muted-foreground mt-2">
            Review and approve dataset submissions from organizations
          </p>
        </div>
        
        {/* Organization Filter */}
        <div className="flex items-center gap-2">
          <Label htmlFor="org-filter" className="text-sm font-medium whitespace-nowrap">
            Organization:
          </Label>
          <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
            <SelectTrigger id="org-filter" className="w-[250px]">
              <SelectValue placeholder="All Organizations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Organizations</SelectItem>
              {organisationsData?.data?.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-5 max-w-4xl">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingData?.data?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="under-review" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Under Review ({underReviewData?.data?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Approved ({approvedData?.data?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Rejected ({rejectedData?.data?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            All ({allData?.data?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Submissions</CardTitle>
              <CardDescription>
                Datasets waiting for initial review
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                renderDatasetTable(pendingData?.data || [], true)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="under-review" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Under Review</CardTitle>
              <CardDescription>
                Datasets currently being reviewed
              </CardDescription>
            </CardHeader>
            <CardContent>
              {underReviewLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                renderDatasetTable(underReviewData?.data || [], false)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Approved Datasets</CardTitle>
              <CardDescription>
                Datasets that have been approved and published
              </CardDescription>
            </CardHeader>
            <CardContent>
              {approvedLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                renderDatasetTable(approvedData?.data || [], false)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Rejected Datasets</CardTitle>
              <CardDescription>
                Datasets that were rejected during review
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rejectedLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                renderDatasetTable(rejectedData?.data || [], false)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>All Datasets</CardTitle>
              <CardDescription>
                Complete list of all datasets in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {allLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                renderDatasetTable(allData?.data || [], false)
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={reviewAction !== null} onOpenChange={() => {
        setReviewAction(null);
        setSelectedDataset(null);
        setComment('');
        setReason('');
      }}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Approve Dataset' : 'Reject Dataset'}
            </DialogTitle>
            <DialogDescription>
              {selectedDataset?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {reviewAction === 'approve' ? (
              <div className="space-y-2">
                <Label htmlFor="comment">Comment (Optional)</Label>
                <Textarea
                  id="comment"
                  placeholder="Add any notes or feedback for the submitter..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="reason">
                  Rejection Reason <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Provide a detailed reason for rejection (minimum 20 characters)..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={6}
                  className={reason.length > 0 && reason.length < 20 ? 'border-destructive' : ''}
                />
                <p className="text-sm text-muted-foreground">
                  {reason.length}/20 characters minimum
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReviewAction(null);
                setSelectedDataset(null);
                setComment('');
                setReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant={reviewAction === 'approve' ? 'default' : 'destructive'}
              onClick={handleConfirmReview}
              disabled={
                approveMutation.isPending ||
                rejectMutation.isPending ||
                (reviewAction === 'reject' && reason.length < 20)
              }
            >
              {(approveMutation.isPending || rejectMutation.isPending) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {reviewAction === 'approve' ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Approve Dataset
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Dataset
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
