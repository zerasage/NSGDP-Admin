"use client";

import { useState } from "react";
import { Download, FileText, Loader2, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUploadAgreement } from "@/lib/hooks/useOrganisations";
import { getOrganisationAgreementUrl, type Organisation } from "@/lib/api/organisations";
import { formatDate } from "@/lib/utils/date";
import { toast } from "sonner";

interface OrganisationAgreementCardProps {
  org: Organisation;
  orgId: string;
  slug: string;
  canManage: boolean;
}

export function OrganisationAgreementCard({ org, orgId, slug, canManage }: OrganisationAgreementCardProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [signedAt, setSignedAt] = useState("");
  const [downloading, setDownloading] = useState(false);
  const uploadMutation = useUploadAgreement(slug);

  const hasAgreement = !!org.agreement_file_path;

  const handleUpload = () => {
    if (!file) {
      toast.error("Select a PDF file first");
      return;
    }
    uploadMutation.mutate(
      { orgId, file, signedAt: signedAt || undefined },
      {
        onSuccess: () => {
          toast.success("Agreement uploaded successfully");
          setOpen(false);
          setFile(null);
          setSignedAt("");
        },
        onError: (error) => {
          const err = error as { message?: string };
          toast.error(err?.message || "Failed to upload agreement");
        },
      }
    );
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { url } = await getOrganisationAgreementUrl(orgId);
      window.open(url, "_blank");
    } catch (error) {
      const err = error as { message?: string };
      toast.error(err?.message || "Failed to get download link");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Data-Sharing Agreement</CardTitle>
      </CardHeader>
      <CardContent>
        {hasAgreement ? (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <FileText className="size-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">{org.agreement_file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {org.agreement_signed_at
                    ? `Signed ${formatDate(org.agreement_signed_at)}`
                    : "Signed date not recorded"}
                  {org.agreement_uploaded_at &&
                    ` · Uploaded ${formatDate(org.agreement_uploaded_at)}`}
                </p>
              </div>
            </div>
            {canManage && (
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={handleDownload} disabled={downloading}>
                  {downloading ? <Loader2 className="size-3.5 mr-1 animate-spin" /> : <Download className="size-3.5 mr-1" />}
                  Download
                </Button>
                <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
                  Replace
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">No agreement on file.</p>
            {canManage && (
              <Button size="sm" onClick={() => setOpen(true)}>
                <Upload className="size-3.5 mr-1" />
                Upload Agreement
              </Button>
            )}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={(o) => !uploadMutation.isPending && setOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{hasAgreement ? "Replace Agreement" : "Upload Agreement"}</DialogTitle>
            <DialogDescription>PDF only, up to 10MB.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="agreement-file">
                Agreement File <span className="text-destructive">*</span>
              </Label>
              <Input
                id="agreement-file"
                type="file"
                accept="application/pdf"
                className="mt-1.5"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div>
              <Label htmlFor="agreement-signed-at">Date Signed (optional)</Label>
              <Input
                id="agreement-signed-at"
                type="date"
                className="mt-1.5"
                value={signedAt}
                onChange={(e) => setSignedAt(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={uploadMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={uploadMutation.isPending || !file}>
              {uploadMutation.isPending ? <Loader2 className="size-4 mr-1 animate-spin" /> : null}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
