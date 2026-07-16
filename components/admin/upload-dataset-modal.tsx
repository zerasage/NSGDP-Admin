"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";

interface UploadDatasetModalProps {
  open: boolean;
  onClose: () => void;
  organisationId: string;
  organisationName: string;
}

const DATASET_FORMATS = [
  { value: "csv", label: "CSV" },
  { value: "json", label: "JSON" },
  { value: "geojson", label: "GeoJSON" },
  { value: "shapefile", label: "Shapefile" },
  { value: "excel", label: "Excel" },
  { value: "api", label: "API" },
];

const VISIBILITY_OPTIONS = [
  { value: "public", label: "Public" },
  { value: "restricted", label: "Restricted" },
  { value: "private", label: "Private" },
];

export function UploadDatasetModal({
  open,
  onClose,
  organisationId,
  organisationName,
}: UploadDatasetModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await apiClient.get<any>('/categories', { params: { limit: 100 } });
      // Backend returns { data: { data: [...], total, page, limit } }
      return response.data?.data || [];
    },
    enabled: open,
  });

  const categories = Array.isArray(categoriesData) ? categoriesData : [];
  
  // Generate unique title with timestamp
  const uniqueTitle = `Malaria Cases in Niger State ${new Date().getFullYear()} - ${Date.now().toString().slice(-6)}`;
  
  const [formData, setFormData] = useState({
    title: uniqueTitle,
    description: "Comprehensive dataset tracking malaria cases across all Local Government Areas in Niger State for the year 2024. Includes confirmed cases, deaths, recoveries, and treatment outcomes.",
    format: "csv",
    visibility: "public",
    categoryId: "",
    tags: "malaria, health, niger-state, infectious-disease",
    geographicCoverage: "Niger State, Nigeria",
    license: "CC-BY-4.0",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.format) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      // Create dataset metadata with organization context
      const payload: any = {
        title: formData.title,
        description: formData.description,
        format: formData.format,
        visibility: formData.visibility,
        organisationId: organisationId, // Pass the organization ID
      };

      // Add category if selected
      if (formData.categoryId) {
        payload.categoryId = formData.categoryId;
      }

      // Only add optional fields if they have values
      if (formData.tags) {
        payload.tags = formData.tags.split(",").map((t) => t.trim());
      }
      
      if (formData.geographicCoverage) {
        payload.geographicCoverage = formData.geographicCoverage;
      }
      
      if (formData.license) {
        payload.license = formData.license;
      }

      const response = await apiClient.post("/datasets", payload);

      toast.success("Dataset created successfully", {
        description: "Dataset has been auto-approved and is now live.",
      });

      // Close modal and refresh
      onClose();
      router.refresh();
    } catch (error: any) {
      console.error("Failed to create dataset:", error);
      
      // Handle ApiError properly
      const errorMessage = error.message || error.response?.data?.message || "Please try again";
      
      toast.error("Failed to create dataset", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Dataset</DialogTitle>
          <DialogDescription>
            Create a new dataset for {organisationName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., Malaria Cases in Niger State 2024"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Comprehensive description of the dataset..."
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={4}
              required
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Minimum 20 characters
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="format">
                Format <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.format}
                onValueChange={(value) => handleChange("format", value || "csv")}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {DATASET_FORMATS.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="visibility">Visibility</Label>
              <Select
                value={formData.visibility}
                onValueChange={(value) => handleChange("visibility", value || "public")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VISIBILITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) => handleChange("categoryId", value || "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category (optional)" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category: any) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="geographicCoverage">Geographic Coverage</Label>
            <Input
              id="geographicCoverage"
              placeholder="e.g., Niger State, Nigeria"
              value={formData.geographicCoverage}
              onChange={(e) => handleChange("geographicCoverage", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="e.g., malaria, health, niger-state (comma separated)"
              value={formData.tags}
              onChange={(e) => handleChange("tags", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="license">License</Label>
            <Input
              id="license"
              placeholder="e.g., CC-BY-4.0"
              value={formData.license}
              onChange={(e) => handleChange("license", e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Creating..." : "Create Dataset"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
