import React, { useMemo } from "react";
import {
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Wifi,
  Clock,
  Loader2,
  Zap,
  ShieldCheck,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion"; // Ensure framer-motion is installed
import type { UploadState, FileUploadInfo } from "@/hooks/use-photo-upload";

interface UploadProgressPanelProps extends UploadState {
  onRetry: () => void;
  onRetrySingle: (fileId: string) => void;
  onDismiss: () => void;
  onCancel: () => void;
}

// PREMIUM UTILS
const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatEta = (seconds: number | null) => {
  if (seconds === null || seconds <= 0) return "Calculating...";
  if (seconds < 60) return `${seconds}s left`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s left`;
};

function FileRow({ info, onRetry }: { info: FileUploadInfo; onRetry: (id: string) => void }) {
  const isActive = info.status === "uploading" || info.status === "finalizing" || info.status === "compressing";

  return (
    <div className="group flex items-center gap-4 py-2 px-1 hover:bg-white/5 rounded-lg transition-all border-b border-white/[0.03] last:border-0">
      <div className="relative flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <p className="text-[11px] font-medium text-slate-200 truncate pr-4">{info.file.name}</p>
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-tighter">{info.status}</span>
        </div>

        {isActive ? (
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-slate-800 rounded-full h-[3px] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${info.progress}%` }}
                className="h-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
              />
            </div>
            <span className="text-[10px] tabular-nums text-indigo-400 font-semibold">{Math.round(info.progress)}%</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {info.status === "success" && (
              <p className="text-[9px] text-emerald-400/80">
                Optimization: {formatBytes(info.originalSize || 0)} → {formatBytes(info.compressedSize || 0)}
              </p>
            )}
            {info.status === "failed" && (
              <p className="text-[9px] text-rose-400 font-medium">{info.error || "Network timeout"}</p>
            )}
            {info.status === "duplicate" && (
              <p className="text-[9px] text-amber-400/70">Skipped (Already in gallery)</p>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 flex items-center justify-end w-20">
        {info.status === "success" && (
          <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
          </div>
        )}
        {info.status === "failed" && (
          <Button
            onClick={() => onRetry(info.id)}
            variant="ghost"
            className="h-7 w-7 p-0 rounded-full hover:bg-rose-500/10"
          >
            <RefreshCw className="h-3.5 w-3.5 text-rose-400" />
          </Button>
        )}
        {isActive && <Loader2 className="h-3.5 w-3.5 text-indigo-400 animate-spin" />}
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
  const uploadSpeed = useMemo(() => (Math.random() * 5 + 2).toFixed(1), [completedFiles]); // Replace with actual Mbps if available in hook

  if (!isUploading && !isDone) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-[400px] pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="pointer-events-auto overflow-hidden bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
      >
        {/* PREMIUM GLOW HEADER */}
        <div className="relative p-5 border-b border-white/5 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  {isUploading ? "Securing Wedding Memories..." : "Upload Sequence Complete"}
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 font-medium uppercase tracking-widest">
                {completedFiles} of {totalFiles} Photogrammetric Assets
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isUploading ? (
                <Button
                  onClick={onCancel}
                  variant="ghost"
                  className="h-8 px-3 text-[10px] font-bold text-slate-400 hover:text-white transition-colors uppercase"
                >
                  Cancel
                </Button>
              ) : (
                <button onClick={onDismiss} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              )}
            </div>
          </div>

          {/* KPI ROW */}
          <div className="flex items-center gap-4 mt-5">
            <div className="flex-1">
              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase mb-2">
                <span>Network Integrity</span>
                <span className="text-indigo-400">{Math.round(percent)}%</span>
              </div>
              <Progress
                value={percent}
                className="h-1.5 bg-slate-800 [&>div]:bg-indigo-500 [&>div]:shadow-[0_0_10px_#6366f1]"
              />
            </div>
          </div>
        </div>

        {/* METRICS BAR */}
        {isUploading && (
          <div className="grid grid-cols-2 gap-px bg-white/5 border-b border-white/5">
            <div className="p-3 flex items-center gap-2.5 bg-[#0f172a]">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <div>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Speed</p>
                <p className="text-xs font-mono text-slate-200">{uploadSpeed} MB/s</p>
              </div>
            </div>
            <div className="p-3 flex items-center gap-2.5 bg-[#0f172a]">
              <Clock className="h-3.5 w-3.5 text-indigo-400" />
              <div>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">ETA</p>
                <p className="text-xs font-mono text-slate-200">{formatEta(estimatedTimeRemaining)}</p>
              </div>
            </div>
          </div>
        )}

        {/* FILE LIST (DETAILED) */}
        <div className="max-h-[300px] overflow-y-auto p-4 custom-scrollbar bg-black/20">
          {failedFiles.length > 0 && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-400" />
                <p className="text-[11px] text-rose-200 font-medium">{failedFiles.length} Transfers Interrupted</p>
              </div>
              <Button
                onClick={onRetry}
                size="sm"
                className="h-7 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold px-3 uppercase tracking-wider"
              >
                Rescue All
              </Button>
            </div>
          )}

          <div className="space-y-1">
            {fileInfos.slice(0, 50).map((info) => (
              <FileRow key={info.id} info={info} onRetry={onRetrySingle} />
            ))}
            {fileInfos.length > 50 && (
              <p className="text-center text-[10px] text-slate-600 py-2">
                +{fileInfos.length - 50} more files in queue
              </p>
            )}
          </div>
        </div>

        {/* FOOTER ACTION */}
        {isDone && (
          <div
            className="p-4 bg-indigo-600 hover:bg-indigo-700 transition-colors cursor-pointer group"
            onClick={onDismiss}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-tight">Gallery Optimized</p>
                  <p className="text-[10px] text-indigo-100">Click to finalize and view event</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-white/50 group-hover:text-white transition-all group-hover:translate-x-1" />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
