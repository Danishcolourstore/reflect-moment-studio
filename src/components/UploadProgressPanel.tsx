import { CheckCircle2, AlertCircle, X, RefreshCw, Wifi, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { UploadState, FileUploadInfo } from '@/hooks/use-photo-upload';

interface UploadProgressPanelProps extends UploadState {
  onRetry: () => void;
  onRetrySingle: (fileId: string) => void;
  onDismiss: () => void;
  onCancel: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function formatEta(seconds: number | null): string {
  if (seconds === null || seconds <= 0) return '';
  if (seconds < 60) return `~${seconds}s remaining`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `~${mins}m ${secs}s remaining`;
}

function FileRow({ info, onRetry }: { info: FileUploadInfo; onRetry: (id: string) => void }) {
  const name = info.file.name.length > 24 ? info.file.name.slice(0, 21) + '…' : info.file.name;

  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-foreground/80 truncate">{name}</p>
        {(info.status === 'uploading' || info.status === 'finalizing') && (
          <div className="flex items-center gap-2 mt-1">
            <Progress value={info.progress} className="h-0.5 flex-1" />
            <Loader2 className="h-3 w-3 text-muted-foreground/50 animate-spin shrink-0" />
          </div>
        )}
        {info.status === 'finalizing' && (
          <p className="text-[9px] text-primary/60 mt-0.5">Finalizing upload, please wait…</p>
        )}
        {info.status === 'compressing' && (
          <p className="text-[9px] text-muted-foreground/50 mt-0.5">Compressing…</p>
        )}
        {info.status === 'duplicate' && (
          <p className="text-[9px] text-amber-500/80 mt-0.5">Duplicate — skipped</p>
        )}
        {info.status === 'success' && info.originalSize && info.compressedSize && info.originalSize !== info.compressedSize && (
          <p className="text-[9px] text-muted-foreground/40 mt-0.5">{formatBytes(info.originalSize)} → {formatBytes(info.compressedSize)}</p>
        )}
        {info.status === 'failed' && info.error && (
          <p className="text-[9px] text-destructive/80 mt-0.5">{info.error}</p>
        )}
        {info.status === 'success' && (
          <p className="text-[9px] text-primary/60 mt-0.5">Uploaded</p>
        )}
      </div>
      <div className="shrink-0">
      {info.status === 'success' && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
        {info.status === 'duplicate' && <AlertCircle className="h-3.5 w-3.5 text-amber-500/70" />}
        {info.status === 'failed' && (
          <Button
            onClick={() => onRetry(info.id)}
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[9px] uppercase tracking-wide text-primary hover:bg-primary/10"
          >
            <RefreshCw className="h-3 w-3 mr-1" /> Retry
          </Button>
        )}
        {info.status === 'pending' && (
          <Clock className="h-3 w-3 text-muted-foreground/30" />
        )}
      </div>
    </div>
  );
}

export function UploadProgressPanel({
  isUploading,
  totalFiles,
  completedFiles,
  successCount,
  failedFiles,
  duplicateCount = 0,
  isDone,
  percent,
  fileInfos,
  estimatedTimeRemaining,
  onRetry,
  onRetrySingle,
  onDismiss,
  onCancel,
}: UploadProgressPanelProps) {
  if (!isUploading && !isDone) return null;

  const hasFailed = failedFiles.length > 0;
  const showSlowWarning = isUploading && estimatedTimeRemaining !== null && estimatedTimeRemaining > 120;

  return (
    <>
      {/* Desktop panel */}
      <div className="hidden sm:block mb-5">
        <div className="border border-border/30 bg-card/50 rounded-xl px-5 py-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            {isUploading ? (
              <div>
                <p className="text-[12px] text-foreground font-medium">
                  Uploading {completedFiles} of {totalFiles} photos…
                </p>
                {estimatedTimeRemaining !== null && (
                  <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                    {formatEta(estimatedTimeRemaining)}
                  </p>
                )}
              </div>
            ) : isDone && !hasFailed ? (
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle2 className="h-4 w-4" />
                <p className="text-[12px] font-medium">
                  Upload Complete — {successCount} Photos Added
                  {duplicateCount > 0 && <span className="text-muted-foreground ml-1">({duplicateCount} duplicates skipped)</span>}
                </p>
              </div>
            ) : isDone && hasFailed ? (
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <p className="text-[12px] font-medium">
                  {successCount} uploaded, {failedFiles.length} failed
                </p>
              </div>
            ) : null}

            <div className="flex items-center gap-1.5">
              {isUploading && (
                <Button onClick={onCancel} variant="ghost" size="sm" className="text-[10px] h-7 px-2.5 uppercase tracking-[0.06em] text-muted-foreground">
                  Cancel
                </Button>
              )}
              {isDone && hasFailed && (
                <Button onClick={onRetry} variant="ghost" size="sm" className="text-primary hover:bg-primary/10 text-[10px] h-7 px-2.5 uppercase tracking-[0.06em]">
                  Retry All
                </Button>
              )}
              {isDone && (
                <button onClick={onDismiss} className="text-muted-foreground/40 hover:text-foreground transition-colors p-1">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {isUploading && <Progress value={percent} className="h-1" />}

          {/* Slow warning */}
          {showSlowWarning && (
            <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2">
              <Wifi className="h-3.5 w-3.5 text-muted-foreground/60" />
              <p className="text-[10px] text-muted-foreground/70">Slow connection — photos uploading one at a time for reliability</p>
            </div>
          )}

          {/* File list (show during active upload or if failures) */}
          {(isUploading || hasFailed) && fileInfos.length <= 30 && (
            <div className="max-h-48 overflow-y-auto space-y-0.5 mt-2">
              {fileInfos
                .filter((f) => f.status !== 'pending' || isUploading)
                .filter((f) => isUploading ? f.status !== 'pending' || fileInfos.indexOf(f) < completedFiles + 3 : f.status === 'failed')
                .map((info) => (
                  <FileRow key={info.id} info={info} onRetry={onRetrySingle} />
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile sticky bottom panel */}
      <div className="fixed bottom-16 left-0 right-0 z-40 sm:hidden px-3">
        <div className="border border-border/30 bg-card rounded-xl px-4 py-3 shadow-lg space-y-2.5 mx-auto max-w-md">
          <div className="flex items-center justify-between">
            {isUploading ? (
              <div>
                <p className="text-[11px] text-foreground font-medium">
                  Uploading {completedFiles}/{totalFiles}
                </p>
                {estimatedTimeRemaining !== null && (
                  <p className="text-[9px] text-muted-foreground/40 mt-0.5">{formatEta(estimatedTimeRemaining)}</p>
                )}
              </div>
            ) : isDone && !hasFailed ? (
              <div className="flex items-center gap-1.5 text-primary">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <p className="text-[11px] font-medium">{successCount} photos added</p>
              </div>
            ) : isDone && hasFailed ? (
              <div className="flex items-center gap-1.5 text-destructive">
                <AlertCircle className="h-3.5 w-3.5" />
                <p className="text-[11px] font-medium">{failedFiles.length} failed</p>
              </div>
            ) : null}

            <div className="flex items-center gap-1">
              {isUploading && (
                <Button onClick={onCancel} variant="ghost" size="sm" className="text-[10px] h-6 px-2 uppercase text-muted-foreground">
                  Cancel
                </Button>
              )}
              {isDone && hasFailed && (
                <Button onClick={onRetry} variant="ghost" size="sm" className="text-primary text-[10px] h-6 px-2 uppercase">
                  Retry All
                </Button>
              )}
              {isDone && (
                <button onClick={onDismiss} className="text-muted-foreground/40 p-0.5">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {isUploading && <Progress value={percent} className="h-1" />}

          {isUploading && (
            <p className="text-[9px] text-muted-foreground/40">
              {totalFiles - completedFiles} remaining · {percent}%
            </p>
          )}

          {/* Show failed files on mobile */}
          {isDone && hasFailed && (
            <div className="max-h-32 overflow-y-auto space-y-1 mt-1">
              {fileInfos.filter((f) => f.status === 'failed').map((info) => (
                <FileRow key={info.id} info={info} onRetry={onRetrySingle} />
              ))}
            </div>
          )}

          {showSlowWarning && (
            <p className="text-[9px] text-muted-foreground/50 flex items-center gap-1">
              <Wifi className="h-3 w-3" /> Slow connection detected
            </p>
          )}
        </div>
      </div>
    </>
  );
}
