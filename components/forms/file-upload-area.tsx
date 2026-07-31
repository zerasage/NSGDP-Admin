"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface UploadedFile {
  file: File; // the actual File object, needed to upload it
  name: string;
  size: number;
  progress: number;
  format?: string;
  error?: string;
}

interface FileUploadAreaProps {
  files: UploadedFile[];
  onFilesChange: (update: UploadedFile[] | ((prev: UploadedFile[]) => UploadedFile[])) => void;
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

  const addFiles = useCallback(
    (fileList: File[]) => {
      // Build every entry up front and append them in one functional update —
      // calling onFilesChange once per file with a stale `files` snapshot
      // meant selecting several files at once silently kept only the last one.
      const newEntries: UploadedFile[] = fileList.map((file) =>
        file.size > maxSizeMB * 1024 * 1024
          ? {
              file,
              name: file.name,
              size: file.size,
              progress: 0,
              error: `File exceeds ${maxSizeMB}MB limit`,
            }
          : {
              file,
              name: file.name,
              size: file.size,
              progress: 100,
              format: detectFormat(file.name),
            }
      );

      onFilesChange((prev) => [...prev, ...newEntries]);
    },
    [maxSizeMB, onFilesChange]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files ?? []));
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
          "relative rounded-xl border-2 border-dashed p-8 text-center transition-colors sm:p-10",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        )}
      >
        <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-lg bg-muted">
          <Upload className="size-5 text-muted-foreground" aria-hidden="true" />
        </div>
        <p className="text-sm font-medium">Drag and drop files here</p>
        <p className="text-xs text-muted-foreground mt-1">
          or click to browse · Maximum {maxSizeMB}MB per file
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
        <ul className="mt-4 divide-y rounded-xl border" aria-label="Selected files">
          {files.map((file) => (
            <li
              key={file.name}
              className={cn(
                "flex items-center gap-3 p-3 first:rounded-t-xl last:rounded-b-xl",
                file.error && "bg-destructive/5"
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
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                )}
                {!file.error && file.progress === 100 && (
                  <p className="mt-1 text-xs text-success">Ready to upload</p>
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
