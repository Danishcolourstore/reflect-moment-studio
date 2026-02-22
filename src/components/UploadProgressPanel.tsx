import { CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { UploadState } from '@/hooks/use-photo-upload';

interface UploadProgressPanelProps extends UploadState {
  onRetry: () => void;
  onDismiss: () => void;
}

export function UploadProgressPanel({
  isUploading,
  totalFiles,
  completedFiles,
  successCount,
  failedFiles,
  isDone,
  percent,
  currentFileName,
  currentFileIndex,
  errorMessage,
  onRetry,
  onDismiss,
}: UploadProgressPanelProps) {
  if (!isUploading && !isDone) return null;

  const remaining = totalFiles - completedFiles;
  const hasFailed = failedFiles.length > 0;

  return (
    <>
      {/* Desktop: inline panel above grid */}
      <div className="hidden sm:block mb-5">
        <div className="border border-border bg-card px-5 py-4 space-y-3">
          <div className="flex items-center justify-between">
            {isUploading ? (
              <div className="space-y-0.5">
                <p className="text-[12px] text-foreground font-medium flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  Uploading {completedFiles + 1} of {totalFiles}
                  <span className="text-muted-foreground/50 font-normal">
                    · {remaining} remaining
                  </span>
                </p>
                {currentFileName && (
                  <p className="text-[10px] text-muted-foreground/60 truncate max-w-xs">
                    {currentFileName}
                  </p>
                )}
              </div>
            ) : isDone && !hasFailed ? (
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle2 className="h-4 w-4" />
                <p className="text-[12px] font-medium">
                  Upload Complete — {successCount} Photos Added
                </p>
              </div>
            ) : isDone && hasFailed ? (
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-[12px] font-medium">
                    {successCount > 0
                      ? `${successCount} uploaded, ${failedFiles.length} failed`
                      : `${failedFiles.length} upload${failedFiles.length > 1 ? 's' : ''} failed`}
                  </p>
                </div>
                {errorMessage && (
                  <p className="text-[10px] text-destructive/70">{errorMessage}</p>
                )}
              </div>
            ) : null}

            <div className="flex items-center gap-1.5">
              {isDone && hasFailed && (
                <Button
                  onClick={onRetry}
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:bg-primary/10 text-[10px] h-7 px-2.5 uppercase tracking-[0.06em]"
                >
                  Retry Failed
                </Button>
              )}
              {isDone && (
                <button
                  onClick={onDismiss}
                  className="text-muted-foreground/40 hover:text-foreground transition-colors p-1"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {isUploading && (
            <Progress value={percent} className="h-1" />
          )}

          {isUploading && errorMessage && (
            <p className="text-[10px] text-destructive/70">{errorMessage}</p>
          )}
        </div>
      </div>

      {/* Mobile: sticky bottom panel */}
      <div className="fixed bottom-16 left-0 right-0 z-40 sm:hidden px-3">
        <div className="border border-border bg-card px-4 py-3 shadow-lg space-y-2.5 mx-auto max-w-md">
          <div className="flex items-center justify-between">
            {isUploading ? (
              <div className="space-y-0.5">
                <p className="text-[11px] text-foreground font-medium flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  {completedFiles + 1}/{totalFiles}
                </p>
                {currentFileName && (
                  <p className="text-[9px] text-muted-foreground/60 truncate max-w-[200px]">
                    {currentFileName}
                  </p>
                )}
              </div>
            ) : isDone && !hasFailed ? (
              <div className="flex items-center gap-1.5 text-primary">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <p className="text-[11px] font-medium">{successCount} photos added</p>
              </div>
            ) : isDone && hasFailed ? (
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-destructive">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <p className="text-[11px] font-medium">{failedFiles.length} failed</p>
                </div>
                {errorMessage && (
                  <p className="text-[9px] text-destructive/70 truncate max-w-[200px]">{errorMessage}</p>
                )}
              </div>
            ) : null}

            <div className="flex items-center gap-1">
              {isDone && hasFailed && (
                <Button
                  onClick={onRetry}
                  variant="ghost"
                  size="sm"
                  className="text-primary text-[10px] h-6 px-2 uppercase"
                >
                  Retry
                </Button>
              )}
              {isDone && (
                <button onClick={onDismiss} className="text-muted-foreground/40 p-0.5">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {isUploading && (
            <Progress value={percent} className="h-1" />
          )}

          {isUploading && (
            <p className="text-[9px] text-muted-foreground/40">
              {totalFiles - completedFiles} remaining · {percent}%
            </p>
          )}
        </div>
      </div>
    </>
  );
}
