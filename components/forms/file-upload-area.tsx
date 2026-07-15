"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface UploadedFile {
  name: string;
  size: number;
  progress: number;
  format?: string;
  error?: string;
}

interface FileUploadAreaProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
}

function detectFormat(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    csv: "CSV",
    xlsx: "XLSX",
    xls: "XLSX",
    pdf: "PDF",
    json: "JSON",
    geojson: "GeoJSON",
    zip: "Shapefile",
    kml: "KML",
    kmz: "KML",
    gpkg: "GeoPackage",
  };
  return map[ext] ?? "Other";
}

export function FileUploadArea({
  files,
  onFilesChange,
  accept = ".csv,.xlsx,.xls,.pdf,.json,.geojson,.zip,.kml,.kmz,.gpkg",
  maxSizeMB = 50,
  className,
}: FileUploadAreaProps) {
  const [dragOver, setDragOver] = useState(false);

  const simulateUpload = useCallback(
    (fileList: File[]) => {
      fileList.forEach((file) => {
        if (file.size > maxSizeMB * 1024 * 1024) {
          onFilesChange([
            ...files,
            {
              name: file.name,
              size: file.size,
              progress: 0,
              error: `File exceeds ${maxSizeMB}MB limit`,
            },
          ]);
          return;
        }

        const newFile: UploadedFile = {
          name: file.name,
          size: file.size,
          progress: 0,
          format: detectFormat(file.name),
        };
        onFilesChange([...files, newFile]);

        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          onFilesChange(
            files
              .concat(newFile)
              .map((f) =>
                f.name === file.name
                  ? { ...f, progress: Math.min(progress, 100) }
                  : f
              )
          );
          if (progress >= 100) clearInterval(interval);
        }, 200);
      });
    },
    [files, maxSizeMB, onFilesChange]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    simulateUpload(Array.from(e.dataTransfer.files));
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    simulateUpload(Array.from(e.target.files ?? []));
    e.target.value = "";
  };

  const removeFile = (name: string) => {
    onFilesChange(files.filter((f) => f.name !== name));
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={className}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "relative rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        )}
      >
        <Upload className="mx-auto size-10 text-muted-foreground mb-3" aria-hidden="true" />
        <p className="text-sm font-medium">Drag and drop files here</p>
        <p className="text-xs text-muted-foreground mt-1">
          or click to browse · Max {maxSizeMB}MB per file
        </p>
        <input
          type="file"
          multiple
          accept={accept}
          onChange={handleSelect}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label="Upload files"
        />
      </div>

      {files.length > 0 && (
        <ul className="mt-4 space-y-2" aria-label="Uploaded files">
          {files.map((file) => (
            <li
              key={file.name}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3",
                file.error && "border-destructive/50 bg-destructive/5"
              )}
            >
              {file.error ? (
                <AlertCircle className="size-5 text-destructive shrink-0" />
              ) : (
                <FileText className="size-5 text-muted-foreground shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {file.format && `${file.format} · `}
                  {formatBytes(file.size)}
                  {file.error && ` · ${file.error}`}
                </p>
                {!file.error && file.progress < 100 && (
                  <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                )}
                {!file.error && file.progress === 100 && (
                  <p className="text-xs text-success mt-1">Upload complete</p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeFile(file.name)}
                aria-label={`Remove ${file.name}`}
              >
                <X className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
