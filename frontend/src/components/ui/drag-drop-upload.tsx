import { useState, useCallback, useRef, useEffect } from "react";

export interface FileWithProgress extends File {
  id: string;
  progress: number;
}

export interface UseFileUploadOptions {
  maxSize?: number;
  maxFiles?: number;
  accept?: string;
}

export interface DragDropUploadProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  maxFiles?: number;
  maxSize?: number;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function isFileTypeAccepted(file: File, accept?: string): boolean {
  if (!accept) return true;
  const types = accept.split(",").map((t) => t.trim().toLowerCase());
  const fileExt = `.${file.name.split(".").pop()?.toLowerCase()}`;
  const fileType = file.type.toLowerCase();

  return types.some((type) => {
    if (type.startsWith(".")) return fileExt === type;
    if (type.endsWith("/*")) return fileType.startsWith(type.split("/*")[0]);
    return fileType === type;
  });
}

/**
 * Hook for managing file uploads with validation, progress tracking, and file list management.
 *
 * @param options - Configuration for max file size, max file count, and accepted file types.
 * @returns Object containing files list, add/remove/clear methods, errors, and progress map.
 */
export function useFileUpload(options: UseFileUploadOptions = {}) {
  const { maxSize = 10 * 1024 * 1024, maxFiles = 10, accept } = options;
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const progressRef = useRef<Record<string, number>>({});
  const [progressSnapshot, setProgressSnapshot] = useState<Record<string, number>>({});

  useEffect(() => {
    setProgressSnapshot({ ...progressRef.current });
  }, [files]);

  const validateFiles = useCallback(
    (newFiles: File[]): { valid: File[]; errors: string[] } => {
      const validationErrors: string[] = [];
      const valid: File[] = [];

      if (files.length + newFiles.length > maxFiles) {
        validationErrors.push(`Maximum ${maxFiles} files allowed`);
      }

      for (const file of newFiles) {
        if (files.length + valid.length >= maxFiles) {
          validationErrors.push(`Maximum ${maxFiles} files allowed`);
          break;
        }

        if (file.size > maxSize) {
          validationErrors.push(`"${file.name}" exceeds ${formatFileSize(maxSize)} limit`);
          continue;
        }

        if (!isFileTypeAccepted(file, accept)) {
          validationErrors.push(`"${file.name}" is not an accepted file type`);
          continue;
        }

        valid.push(file);
      }

      return { valid, errors: validationErrors };
    },
    [files.length, maxFiles, maxSize, accept],
  );

  const simulateProgress = useCallback((id: string) => {
    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 15;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
      }
      progressRef.current[id] = Math.min(current, 100);
      setProgressSnapshot({ ...progressRef.current });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const { valid, errors: validationErrors } = validateFiles(newFiles);

      if (validationErrors.length > 0) {
        setErrors((prev) => [...prev, ...validationErrors]);
      }

      const filesWithProgress = valid.map((file) => {
        const id = generateId();
        Object.defineProperty(file, "id", { value: id, writable: false });
        Object.defineProperty(file, "progress", { value: 0, writable: true });
        progressRef.current[id] = 0;
        return file as FileWithProgress;
      });

      if (filesWithProgress.length > 0) {
        setFiles((prev) => [...prev, ...filesWithProgress]);
        filesWithProgress.forEach((f) => simulateProgress(f.id));
      }
    },
    [validateFiles, simulateProgress],
  );

  const removeFile = useCallback(
    (index: number) => {
      setFiles((prev) => {
        const file = prev[index];
        if (file) {
          delete progressRef.current[file.id];
          setProgressSnapshot({ ...progressRef.current });
        }
        return prev.filter((_, i) => i !== index);
      });
    },
    [],
  );

  const clearFiles = useCallback(() => {
    progressRef.current = {};
    setProgressSnapshot({});
    setFiles([]);
    setErrors([]);
  }, []);

  return {
    files,
    addFiles,
    removeFile,
    clearFiles,
    errors,
    progress: progressSnapshot,
  };
}

/**
 * Drag and drop file upload component with visual feedback, file previews,
 * progress bars, and validation. Supports keyboard navigation and ARIA labels.
 */
export function DragDropUpload({ onFilesSelected, accept, maxFiles = 10, maxSize = 10 * 1024 * 1024 }: DragDropUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const { files, addFiles, removeFile, clearFiles, errors, progress } = useFileUpload({ maxSize, maxFiles, accept });

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => prev + 1);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => {
      const next = prev - 1;
      if (next === 0) setIsDragging(false);
      return next;
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      setDragCounter(0);

      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        addFiles(droppedFiles);
        onFilesSelected(droppedFiles);
      }
    },
    [addFiles, onFilesSelected],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
      if (selectedFiles.length > 0) {
        addFiles(selectedFiles);
        onFilesSelected(selectedFiles);
        e.target.value = "";
      }
    },
    [addFiles, onFilesSelected],
  );

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleBrowseClick();
      }
    },
    [handleBrowseClick],
  );

  const getThumbnail = useCallback((file: FileWithProgress): string | null => {
    if (file.type.startsWith("image/")) {
      return URL.createObjectURL(file);
    }
    return null;
  }, []);

  useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.type.startsWith("image/")) {
          URL.revokeObjectURL((file as any)._objectUrl || "");
        }
      });
    };
  }, [files]);

  return (
    <div className="w-full space-y-4">
      <div
        ref={dropZoneRef}
        role="button"
        tabIndex={0}
        aria-label="File upload drop zone. Click or press Enter to browse files."
        className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
          isDragging
            ? "border-blue-400 bg-blue-500/10"
            : "border-gray-600 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-800"
        }`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onKeyDown={handleKeyDown}
        onClick={handleBrowseClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={handleFileInput}
          aria-hidden="true"
        />
        <div className="flex flex-col items-center gap-2">
          <svg
            className={`h-10 w-10 ${isDragging ? "text-blue-400" : "text-gray-400"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3"
            />
          </svg>
          <p className="text-sm text-gray-300">
            {isDragging ? (
              <span className="text-blue-400">Drop files here</span>
            ) : (
              <>
                <span className="font-medium">Click to upload</span> or drag and drop
              </>
            )}
          </p>
          <p className="text-xs text-gray-500">
            Max {formatFileSize(maxSize)} per file
            {maxFiles < Infinity ? `, up to ${maxFiles} files` : ""}
            {accept ? `, ${accept}` : ""}
          </p>
        </div>
      </div>

      {errors.length > 0 && (
        <div role="alert" aria-live="polite" className="space-y-1">
          {errors.map((error, i) => (
            <p key={i} className="text-sm text-red-400">
              {error}
            </p>
          ))}
          <button
            type="button"
            onClick={() => {}}
            className="text-xs text-gray-500 underline hover:text-gray-400"
            aria-label="Dismiss errors"
          >
            Dismiss
          </button>
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">
              {files.length} file{files.length !== 1 ? "s" : ""} selected
            </span>
            <button
              type="button"
              onClick={clearFiles}
              className="text-xs text-gray-500 underline hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-gray-900 rounded"
              aria-label="Clear all files"
            >
              Clear all
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {files.map((file, index) => {
              const thumbnail = getThumbnail(file);
              const fileProgress = progress[file.id] ?? 0;
              const isComplete = fileProgress >= 100;

              return (
                <div
                  key={file.id}
                  className="group relative overflow-hidden rounded-lg border border-gray-700 bg-gray-800"
                >
                  <div className="aspect-square flex items-center justify-center bg-gray-900/50">
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt={`Preview of ${file.name}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-gray-500">
                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <span className="text-xs">{file.name.split(".").pop()?.toUpperCase()}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-2">
                    <p className="truncate text-xs text-gray-300" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>

                    <div className="mt-1.5">
                      <div className="h-1 overflow-hidden rounded-full bg-gray-700">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isComplete ? "bg-green-500" : "bg-blue-500"
                          }`}
                          style={{ width: `${fileProgress}%` }}
                          role="progressbar"
                          aria-valuenow={Math.round(fileProgress)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`Upload progress for ${file.name}: ${Math.round(fileProgress)}%`}
                        />
                      </div>
                      <p className="mt-0.5 text-right text-xs text-gray-500">
                        {isComplete ? "Complete" : `${Math.round(fileProgress)}%`}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="absolute top-1 right-1 rounded-full bg-gray-900/80 p-1 text-gray-400 opacity-0 transition-opacity hover:bg-gray-900 hover:text-red-400 focus:opacity-100 group-hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-red-500"
                    aria-label={`Remove ${file.name}`}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
